"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { GameSessionsSchema } from "@/amplify/data/resource";
import { Loader, Button } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation'
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {LoaderComponent} from "./components/loader";

Amplify.configure(outputs);

const dynamoDbClient = generateClient<GameSessionsSchema>();

type Card = {
  word: string;
  type: string; // 'red', 'blue', 'neutral', or 'assassin'
  revealed: boolean;
};

export default function App() {
  const router = useRouter();

  //setGameState is function which updates gameState and returns of type gameState 
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

  const handleGameIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameState((prevState) => ({
      ...prevState,
      gameId: e.target.value,
    }));
  };

  async function routeToGamePage() {
    if (gameState.gameId === undefined) {
      alert("Please enter game ID.");
      return;
    }

    setLoading(true);
    console.log("ROUTING!");
    router.push(`/${gameState.gameId}`);
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

  // async function insertNewGameToDynamo(updatedState: typeof gameState) {
  //   if (!updatedState.gameId) {
  //     alert("Please enter a game ID.");
  //     return;
  //   }
  
  //   try {
  //     console.log("Game State:", updatedState);
  //     console.log("Insert Cards:", updatedState.cards);
  //     await dynamoDbClient.models.GameSessions.create({
  //       GameID: updatedState.gameId,
  //       CurrentTeam: updatedState.currentTeam,
  //       RedCardsLeft: updatedState.redCardsLeft,
  //       BlueCardsLeft: updatedState.blueCardsLeft,
  //       TotalCardsLeft: updatedState.totalCardsLeft,
  //       Categories: JSON.stringify(categories), 
  //       Cards: JSON.stringify(updatedState.cards), 
  //     });
  
  //     console.log("New game record created successfully in DynamoDB");
  //   } catch (error) {
  //     console.error("Error creating game record in DynamoDB:", error);
  //     alert("There was an error saving the game. Please try again.");
  //   }
  // }

  return (
    <main>
      <h1>Codenames AI Game</h1>
      <div className="game-id-input">
        <input
          type="text"
          id="gameId"
          placeholder="Enter Game ID"
          value={gameState.gameId}
          onChange={handleGameIDChange}
        />
        <Button variation="primary" colorTheme="success" onClick={routeToGamePage}>Start</Button>
      </div>

      {loading &&  <LoaderComponent />}
    </main>
  );
}



