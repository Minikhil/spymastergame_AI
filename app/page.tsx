"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { GameSessionsSchema } from "@/amplify/data/resource";
import { Loader, Button, Flex, Input, Label } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation'
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {LoaderComponent} from "./components/LoaderComponent";
import {LandingPage} from "./components/landing-page";
import {Card} from "./types"

Amplify.configure(outputs);

const dynamoDbClient = generateClient<GameSessionsSchema>();

export default function App() {
  const router = useRouter();
  const [categories, setCategories] = useState({
    category1: "",
    category2: "",
    category3: "",
    category4: "",
    category5: "",
  });

  const placeHolderCards: Card[] = [
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "neutral", word: "CREATE" },
    { revealed: false, type: "blue", word: "CUSTOM" },
    { revealed: false, type: "blue", word: "GAME" },
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "blue", word: "" },
    { revealed: false, type: "blue", word: "BOARD" },
    { revealed: false, type: "red", word: "BASED" },
    { revealed: false, type: "neutral", word: "ON" },
    { revealed: false, type: "assassin", word: "" },
    { revealed: false, type: "blue", word: "" },
    { revealed: false, type: "neutral", word: "CATEGORIES" },
    { revealed: false, type: "neutral", word: "ABOVE" },
    { revealed: false, type: "red", word: "ENJOY!" },
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "blue", word: "" },
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "blue", word: "" },
    { revealed: false, type: "blue", word: "" },
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "neutral", word: "" },
    { revealed: false, type: "neutral", word: "" },
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "red", word: "" },
    { revealed: false, type: "neutral", word: "" }
  ];

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

  async function handleGenerateWords() {
    if (gameState.gameId === undefined) {
      alert("Please enter game ID.");
      return;
    }

    setLoading(true);
  
    try {
      /**
       * Wrap the state update in a Promise to ensure it gets completed. This is needed 
         because Reacts setState function are async so once we update it it may not reflect right away 
          since we are passing it to insertNewGameToDynamo we need to wait to ensure updated value is being passed 
        */
      const updatedState = await new Promise<typeof gameState>((resolve) => {

        // Update gameState and return 
        setGameState(prevState => {
          const updatedState = {
            ...prevState,
            cards: placeHolderCards,
          };

          //resolve the promise 
          resolve(updatedState);

          //React expects the function to return the new state value when using functional setState
          return updatedState;
        });

      });
      
      // Promise resolved, insert into DynamoDB and wait for it to complete before routing 
      await insertNewGameToDynamo(updatedState);
      
      console.log("ROUTING!");
      router.push(`/${gameState.gameId}`);
    
    } catch (error) {
      console.error("Error generating words:", error);
      alert("There was an error generating words. Please try again.");
    } finally {
      setLoading(false);
    }
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
    // <main>
    //   <h1>Codenames AI </h1>
    //   <h1 className="text-3xl font-bold underline">
    //   Hello world!
    //  </h1>
    //   <p className="intro">
    //     Play Codenames online across multiple devices on a shared board. 
    //     To create a new game enter a game identifier and click 'Start'.
    //     </p>

    //   <div className="game-id-input">
    //     <input
    //       type="text"
    //       id="gameId"
    //       placeholder="Enter Game Identifier"
    //       value={gameState.gameId}
    //       onChange={handleGameIDChange}
    //     />
    //     <Button variation="primary" colorTheme="success" onClick={handleGenerateWords}>Start</Button>
    //   </div>

    //   {loading &&  <LoaderComponent />}
    // </main>
    <LandingPage/>
  );
}



