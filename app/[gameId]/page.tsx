"use client";


import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { GameSessionsSchema } from "@/amplify/data/resource";
import "../app.css";
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

export default function Page({ params }: { params: { gameId: string } }) {

  const [loading, setLoading] = useState(false);
  //categories is an object that conatins 5 properties 
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
    categories: [];
    cards: Card[]; // Explicitly typing the cards array
  }>({
    gameId: undefined, // Initial empty gameID
    currentTeam: "red",
    redCardsLeft: 9,
    blueCardsLeft: 8,
    totalCardsLeft: (Object.values(categories).length * Object.values(categories).length),
    categories: [],
    cards: [], // Initial empty gameID
  });
  
  const [spymasterView, setSpymasterView] = useState(false);

  //you can pass an empty array as its dependency array. T
  //This tells React to only run the effect once, after the initial render.
  useEffect(() => {
    initGame()
    // Subscribe to update of GameSessions gameId
    // Doc: https://docs.amplify.aws/nextjs/build-a-backend/data/subscribe-data/
    const updateSub = dynamoDbClient.models.GameSessions
    .onUpdate({
      filter: {GameID: {eq: params.gameId?.trim()}}
    }).subscribe({
      next: (data) => {
        //console.log("New Data: " + data.Cards)
        console.log("New Score Red: " + data.RedCardsLeft + "Blue: " + data.BlueCardsLeft)
        setGameState((prevState) => ({
          ...prevState,
          blueCardsLeft: data.BlueCardsLeft,
          redCardsLeft: data.RedCardsLeft,
          totalCardsLeft: data.TotalCardsLeft,
          categories: JSON.parse(data.Categories as string) as [],
          cards: JSON.parse(data.Cards as string) as Card[],
        }));

      },
      error: (error) => console.warn("New Error: " + error),
    });

    //return cleanup function is executed when the component is unmounted or re-rendered
    return () => updateSub.unsubscribe(); 
  }, []);

  
  
  function initGame() {
    console.log("game state start: " + gameState.gameId);
    console.log("Intial Fetch Init")
    gameState.gameId = params.gameId;
    fetchGameData(gameState.gameId)
  }

  // async function fetchGameDataV2(gameId: String) {
  //   const allGames = await dynamoDbClient.models.GameSessions.list();
  //   console.log(allGames);
  // }

  async function fetchGameData(gameId: String) {
    try {

      const { data: gameData, errors } = await dynamoDbClient.models.GameSessions.list({
        filter: { GameID: { eq:gameId?.trim() } }
      });

      console.log("fetched cards data: " + gameData[0].Cards)
  
      // Check if there were any errors
      if (errors) {
        console.error('Errors occurred during query:', errors);
        throw new Error('Failed to fetch game data.');
      }
  
      // Check if any game data was found
      if (!gameData || gameData.length === 0) {
        throw new Error('No game data found for the provided GameID.');
      }

      const latestGameRecord = gameData[0]

      setGameState((prevState) => ({
        ...prevState,
        blueCardsLeft: latestGameRecord.BlueCardsLeft,
        redCardsLeft: latestGameRecord.RedCardsLeft,
        totalCardsLeft: latestGameRecord.TotalCardsLeft,
        categories: JSON.parse(latestGameRecord.Categories as string) as [],
        cards: JSON.parse(latestGameRecord.Cards as string) as Card[],
      }));
  
      //return gameData[0]; // Return the first matching game session
    } catch (error) {
      console.error('Error fetching game data:', error);
      throw error; // Handle the error
    }
  }

  function revealCard(index: number) {
    const newCards = [...gameState.cards];
    //card is reference not a copy 
    //This means modifying card will also modify the object within the newCards array.
    const card = newCards[index];

    //Updates the card count 
    if (!card.revealed) {
      card.revealed = true;
      if (card.type === "assassin") {
        endGame(gameState.currentTeam === "red" ? "blue" : "red");
      }
    }

      // Update the state and then insert into DynamoDB
      setGameState(prevState => {
        //update state 
        const updatedState = {
          ...prevState,
          cards: newCards,
          blueCardsLeft: card.type === "blue" ? prevState.blueCardsLeft - 1 : prevState.blueCardsLeft,
          redCardsLeft: card.type === "red" ? prevState.redCardsLeft - 1 : prevState.redCardsLeft,
          totalCardsLeft: prevState.totalCardsLeft - 1
        };
        
        // Pass updated state to Insert into DynamoDB
        updateGameSession(updatedState);
        
        // return to set the gameState 
        return updatedState;
      });
  }

  async function updateGameSession(updatedGameState: typeof gameState) {
  
    try {
      console.log("Game State for Update:", updatedGameState);
      console.log("Updating Cards:", updatedGameState.cards);

      const { data: gameData, errors } = await dynamoDbClient.models.GameSessions.list({
        filter: { GameID: { eq: gameState.gameId?.trim() } }
      });

      if (errors) {
        console.error('Errors occurred during query:', errors);
        throw new Error('Failed to fetch game data.');
      }
      const latestGameRecord = gameData[0]
  
      await dynamoDbClient.models.GameSessions.update({
        ... latestGameRecord,
        CurrentTeam: updatedGameState.currentTeam,
        RedCardsLeft: updatedGameState.redCardsLeft,
        BlueCardsLeft: updatedGameState.blueCardsLeft,
        TotalCardsLeft: updatedGameState.totalCardsLeft,
        Categories: JSON.stringify(updatedGameState.categories), 
        Cards:  JSON.stringify(updatedGameState.cards), 
        
      });
  
      console.log("Game record updated successfully in DynamoDB");
    } catch (error) { //catches errors in try block 
      console.error("Error updating game record in DynamoDB:", error);
      alert("There was an error saving the game. Please try again.");
    } 
  }
  
  function endTurn() {
    setGameState((prevState) => ({
      ...prevState,
      currentTeam: prevState.currentTeam === "red" ? "blue" : "red",
    }));
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

  //words need to be all the words on board (25 of them )
  function shuffleBoard(words: string[]) {
    let shuffledCards;
    if (words.length === 0) { 
      console.log("Shuffle Board words is empty: " + words)
      //set words 
      const newWords: string[] = [];
      gameState.cards.forEach((card) => {
        newWords.push(card.word); // Assuming 'word' property exists in Card object
      });

      setWords(newWords);
      shuffledCards = createBoard(newWords)
    } else {
      shuffledCards = createBoard(words)
    }

    console.log("Shuffle Board with: " + shuffledCards)

    setGameState((prevState) => ({
      ...prevState,
      cards: shuffledCards
    }));
    toggleAllCardsVisibility(spymasterView)
  }

  function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  
  function endGame(winner: string) {
    alert(`${winner.charAt(0).toUpperCase() + winner.slice(1)} team wins!`);
    //createBoard(words); // Reset board
  }

  function toggleAllCardsVisibility(reveal: boolean) {
    setGameState((prevState) => ({
      ...prevState,
      cards: prevState.cards.map((card) => ({
        ...card,
        revealed: reveal,
      })),
    }));
  }
  
  useEffect(() => {
    toggleAllCardsVisibility(spymasterView);
  }, [spymasterView]);

  // console.log("game state end: " + gameState.gameId);

  // console.log("cards end: " + JSON.stringify(gameState.cards));

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
        console.log("Words: " + words)
        const newCards = createBoard(flatWords);
        
         // Update the state and then insert into DynamoDB
         setGameState(prevState => {
          //update state 
          const updatedState = {
            ...prevState,
            cards: newCards,
            categories: categoryValues as [],
            totalCardsLeft: 25,
            redCardsLeft: 9,
            blueCardsLeft: 8,
          };
          
          // Pass updated state to Insert into DynamoDB
          updateGameSession(updatedState);
          
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
    }
  }
  
  return (
  <main>
    <h1>Code Names Game ID: {params.gameId}</h1>
    <div className="category-input">
        <input type="text" id="category1" placeholder="Category 1" value={categories.category1} onChange={handleChange} />
        <input type="text" id="category2" placeholder="Category 2" value={categories.category2} onChange={handleChange} />
        <input type="text" id="category3" placeholder="Category 3" value={categories.category3} onChange={handleChange} />
        <input type="text" id="category4" placeholder="Category 4" value={categories.category4} onChange={handleChange} />
        <input type="text" id="category5" placeholder="Category 5" value={categories.category5} onChange={handleChange} />
        <button onClick={handleGenerateWords}>Generate Words</button>
      </div>

      {loading && <div id="loading-indicator">Generating words...</div>}

      <div className="turn-indicator">
        {`${gameState.currentTeam.charAt(0).toUpperCase() + gameState.currentTeam.slice(1)} Team's Turn`}
      </div>

      <div className="score-board">
       <span className="redCardsLeft"> {`${gameState.redCardsLeft} -`} </span>
       <span className="blueCardsLeft"> {`${gameState.blueCardsLeft}`} </span>
      </div>

      <div className="game-board">
        {gameState.cards.map((card, i) => (
          <div
            key={i}
            className={`card ${card.revealed ? card.type : ""}`}
            onClick={() => revealCard(i)}
          >
            {card.word}
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={() => shuffleBoard(words)}
        >New Code
        </button>

        <button onClick={endTurn}>
          End Turn
          </button>

          <label>
          <input
            type="checkbox"
            checked={spymasterView}
            onChange={(e) => setSpymasterView(e.target.checked)}
          />
          Spymaster View
        </label>
      </div>
      
      {/* <button type="button" 
      className = "text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
        Purple to Pink
        </button> */}

  </main>
  );
  
  }