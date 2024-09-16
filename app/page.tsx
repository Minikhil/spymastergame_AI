"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { GameSessionsSchema } from "@/amplify/data/resource";
import { useRouter } from 'next/navigation'
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const dynamoDbClient = generateClient<GameSessionsSchema>();

type Card = {
  word: string;
  type: string; // 'red', 'blue', 'neutral', or 'assassin'
  revealed: boolean;
};

export default function App() {
  const router = useRouter();
  const [categories, setCategories] = useState({
    category1: "",
    category2: "",
    category3: "",
    category4: "",
    category5: "",
  });
  const [words, setWords] = useState<string[]>([]);

  const [gameState, setGameState] = useState<{
    gameId: string | undefined;
    currentTeam: string;
    redCardsLeft: number;
    blueCardsLeft: number;
    totalCardsLeft: number,
    cards: Card[];
  }>({
    gameId: undefined,
    currentTeam: "red",
    redCardsLeft: 9,
    blueCardsLeft: 8,
    totalCardsLeft: 25,
    cards: [],
  });

  const [loading, setLoading] = useState(false);
  const [spymasterView, setSpymasterView] = useState(false);

  const handleGameIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameState((prevState) => ({
      ...prevState,
      gameId: e.target.value,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCategories((prevCategories) => ({
      ...prevCategories,
      [id]: value,
    }));
  };

  async function handleGenerateWords() {
    if (gameState.gameId === undefined) {
      alert("Please enter game ID.");
      return;
    }

    const categoryValues = Object.values(categories).filter((cat) => cat.trim() !== "");
  
    if (categoryValues.length < 5) {
      alert("Please enter all 5 categories.");
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: categoryValues }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch words");
      }
  
      const generatedWords = await response.json();
      const parsedWords = JSON.parse(generatedWords);
  
      if (Array.isArray(parsedWords)) {
        const flatWords = parsedWords.flat();
        setWords(flatWords);
        const newCards = createBoard(flatWords);
        
        // Update the state and then insert into DynamoDB
        setGameState(prevState => {
          //update state 
          const updatedState = {
            ...prevState,
            cards: newCards,
            totalCardsLeft: 25,
            redCardsLeft: 9,
            blueCardsLeft: 8,
          };
          
          // Pass updated state to Insert into DynamoDB
          insertNewGameToDynamo(updatedState);
          
          return updatedState;
        });
      } else {
        throw new Error("Invalid format of generated words");
      }
    } catch (error) {
      console.error("Error generating words:", error);
      alert("There was an error generating words. Please try again.");
    } finally {
      setLoading(false);
      router.push(`/${gameState.gameId}`);
    }
  }

  function createBoard(words: string[]): Card[] {
    const shuffledWords = shuffleArray(words).slice(0, 25);
    const cardTypes = shuffleArray([
      "red", "red", "red", "red", "red", "red", "red", "red", "red",
      "blue", "blue", "blue", "blue", "blue", "blue", "blue", "blue",
      "neutral", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral",
      "assassin",
    ]);

    const newCards = shuffledWords.map((word, i) => ({
      word,
      type: cardTypes[i],
      revealed: false,
    }));

    console.log("Words Updated:", words);
    console.log("shuffledWords:", shuffledWords);
    console.log("Cards Updated:", newCards);

    return newCards;
  }

  function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  async function insertNewGameToDynamo(updatedState: typeof gameState) {
    if (!updatedState.gameId) {
      alert("Please enter a game ID.");
      return;
    }
  
    try {
      console.log("Game State:", updatedState);
      console.log("Insert Cards:", updatedState.cards);
      await dynamoDbClient.models.GameSessions.create({
        GameID: updatedState.gameId,
        CurrentTeam: updatedState.currentTeam,
        RedCardsLeft: updatedState.redCardsLeft,
        BlueCardsLeft: updatedState.blueCardsLeft,
        TotalCardsLeft: updatedState.totalCardsLeft,
        Categories: JSON.stringify(categories), 
        Cards: JSON.stringify(updatedState.cards), 
      });
  
      console.log("New game record created successfully in DynamoDB");
    } catch (error) {
      console.error("Error creating game record in DynamoDB:", error);
      alert("There was an error saving the game. Please try again.");
    }
  }

  return (
    <main>
      <h2>Codenames AI Game</h2>
      <div className="game-id-input">
        <input
          type="text"
          id="gameId"
          placeholder="Enter Game ID"
          value={gameState.gameId}
          onChange={handleGameIDChange}
        />
      </div>

      <div className="category-input">
        <input type="text" id="category1" placeholder="Category 1" value={categories.category1} onChange={handleChange} />
        <input type="text" id="category2" placeholder="Category 2" value={categories.category2} onChange={handleChange} />
        <input type="text" id="category3" placeholder="Category 3" value={categories.category3} onChange={handleChange} />
        <input type="text" id="category4" placeholder="Category 4" value={categories.category4} onChange={handleChange} />
        <input type="text" id="category5" placeholder="Category 5" value={categories.category5} onChange={handleChange} />
        <button onClick={handleGenerateWords}>Generate Words</button>
      </div>

      {loading && <div id="loading-indicator">Generating words...</div>}
    </main>
  );
}



