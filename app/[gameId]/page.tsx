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
  }, []);
  
  function initGame() {
    console.log("game state start: " + gameState.gameId);
    console.log("Intial Fetch Init")
    gameState.gameId = params.gameId;
    fetchGameData(gameState.gameId)
  }

  async function fetchGameDataV2(gameId: String) {
    const allGames = await dynamoDbClient.models.GameSessions.list();
    console.log(allGames);
  }

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
  
  async function syncGameBoard(isFirst: boolean) {
    try {
      console.log("syncBoard is First? " + isFirst)
      
      // Fetch the latest record using observeQuery and filter
      const subscription = dynamoDbClient.models.GameSessions.observeQuery({
        filter: { GameID: { eq: gameState.gameId?.trim() } }, // Filter by gameId
      }).subscribe({
        next: async ({ items }) => {
          console.log("Fetch data for gameID: " + gameState.gameId)
          if (items.length > 0) {
            console.log("Items received: ", items);
            // Extract the latest record (assuming descending sort on createdAt)
            const latestGameRecord = items[0];
            console.log("Fetched record: ", latestGameRecord);
  
            if (isFirst) {
              //first time fetch just grab data from DB
              setGameState((prevState) => ({
                ...prevState,
                blueCardsLeft: latestGameRecord.BlueCardsLeft,
                redCardsLeft: latestGameRecord.RedCardsLeft,
                totalCardsLeft: latestGameRecord.TotalCardsLeft,
                categories: JSON.parse(latestGameRecord.Categories as string) as [],
                cards: JSON.parse(latestGameRecord.Cards as string) as Card[],
              }));

            } else {
              // board has been updated, insert into DB updated state 
              const updatedRecord = {
                ...latestGameRecord,
                CurrentTeam: gameState.currentTeam,
                RedCardsLeft: gameState.redCardsLeft,
                BlueCardsLeft: gameState.blueCardsLeft,
                Cards: JSON.stringify(gameState.cards),  // Update cards if needed
              };

              console.log("Updating record with cards: ", updatedRecord.Cards);

              // Update the record in DynamoDB (only once)
              await dynamoDbClient.models.GameSessions.update(updatedRecord);
              console.log("Game record updated successfully in DynamoDB");
            }
            
          } else {
            console.log("No game record found for this gameId");
          }
  
          // Unsubscribe from the subscription after processing the initial data
          subscription.unsubscribe();
        },
        error: (error) => {
          console.error("Error fetching game record:", error);
          // Handle error (e.g., display message)
        },
      });
  
      return () => subscription.unsubscribe(); // Cleanup function (optional)
    } catch (error) {
      console.error("Error updating game record:", error);
      // Handle error (e.g., display message)
    }
  };

  /**
   * when gameId or cards are update sync the baord 
   */
  // useEffect(() => {
  //   syncGameBoard(true);
  // }, [gameState.gameId]);

  // useEffect(() => {
  //   if (gameState.gameId) {
  //     console.log("Syncing game board with gameId:", gameState.gameId);
  //     syncGameBoard(true);
  //   } else {
  //     console.log("gameState.gameId is undefined or empty. Sync not triggered.");
  //   }
  // }, [gameState.gameId]);

  // useEffect(() => {
  //   if (gameState.gameId) {
  //     console.log("Cards Updated Syncing game board with gameId:", gameState.gameId);
  //     syncGameBoard(false);
  //   } else {
  //     console.log("Cards Updated gameState.gameId is undefined or empty. Sync not triggered.");
  //   }
  // }, [gameState.totalCardsLeft]);
  

  
  function revealCard(index: number) {
    const newCards = [...gameState.cards];
    const card = newCards[index];

    if (!card.revealed) {
      card.revealed = true;
      if (card.type === "assassin") {
        endGame(gameState.currentTeam === "red" ? "blue" : "red");
      } else {
        updateCardCount(card.type);
      }
    }

    setGameState((prevState) => ({
      ...prevState,
      cards: newCards,
    }));

    //Make a call to DB to update cards 
    //syncGameBoard();
  }

  function updateCardCount(type: string) {
    if (type === "red") {
      setGameState((prevState) => ({
        ...prevState,
        redCardsLeft: prevState.redCardsLeft - 1,
        totalCardsLeft: prevState.totalCardsLeft -1
      }));
    } else if (type === "blue") {
      setGameState((prevState) => ({
        ...prevState,
        blueCardsLeft: prevState.blueCardsLeft - 1,
        totalCardsLeft: prevState.totalCardsLeft -1
      }));
    }
  }
  
  function endTurn() {
    setGameState((prevState) => ({
      ...prevState,
      currentTeam: prevState.currentTeam === "red" ? "blue" : "red",
    }));
  }

  function createBoard(words: string[]) {
    const shuffledWords = shuffleArray(words).slice(0, 25);
    const cardTypes = shuffleArray([
      "red", "red", "red", "red", "red", "red", "red", "red", "red",
      "blue", "blue", "blue", "blue", "blue", "blue", "blue", "blue",
      "neutral", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral",
      "assassin",
    ]);

    setGameState((prevState) => ({
      ...prevState,
      cards: shuffledWords.map((word, i) => ({
        word,
        type: cardTypes[i],
        revealed: false,
        index: i
      })),
    }));
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
  
  // useEffect(() => {
  //   toggleAllCardsVisibility(spymasterView);
  // }, [spymasterView]);

  console.log("game state end: " + gameState.gameId);

  console.log("cards end: " + JSON.stringify(gameState.cards));
  
  return (
  <main>
    <div>Code Names Game ID: {params.gameId}</div>
    <div className="spymaster-toggle">
        <label>
          <input
            type="checkbox"
            checked={spymasterView}
            onChange={(e) => setSpymasterView(e.target.checked)}
          />
          Spymaster View
        </label>
      </div>

      <div className="turn-indicator">
        {`${gameState.currentTeam.charAt(0).toUpperCase() + gameState.currentTeam.slice(1)} Team's Turn`}
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
        <button onClick={() => createBoard(words)}>New Game</button>
        <button onClick={endTurn}>End Turn</button>
      </div>
  </main>
  );
  
  }