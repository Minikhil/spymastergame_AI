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
    cards: Card[]; // Explicitly typing the cards array
  }>({
    gameId: undefined, // Initial empty gameID
    currentTeam: "red",
    redCardsLeft: 9,
    blueCardsLeft: 8,
    cards: [], // Initial empty gameID
  });

   //init game
   gameState.gameId = params.gameId;

  const [loading, setLoading] = useState(false);
  const [spymasterView, setSpymasterView] = useState(false);

  async function syncGameBoard() {
    try {
      // Fetch the latest record using observeQuery and filter
      const subscription = dynamoDbClient.models.GameSessions.observeQuery({
        filter: { GameID: { eq: gameState.gameId } }, // Filter by gameId
      }).subscribe({
        next: async ({ items }) => {
          if (items.length > 0) {
            // Extract the latest record (assuming descending sort on createdAt)
            const latestGameRecord = items[0];
  
            // Update the record with latest data and state
            const updatedRecord = {
              ...latestGameRecord,
              CurrentTeam: gameState.currentTeam,
              RedCardsLeft: gameState.redCardsLeft,
              BlueCardsLeft: gameState.blueCardsLeft,
              Cards: JSON.stringify(gameState.cards),  // Update cards if needed
            };
  
            // Update the record in DynamoDB (only once)
            await dynamoDbClient.models.GameSessions.update(updatedRecord);
            console.log("Game record updated successfully in DynamoDB");
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
  useEffect(() => {
    syncGameBoard();
  }, [params.gameId, gameState.cards]);



  
  
  
  
  
  
  
  
  
  
  
  return (
  <div>Code Names Game ID: {params.gameId}</div>
  );
  
  }