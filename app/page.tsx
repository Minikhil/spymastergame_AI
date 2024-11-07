"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { GameSessionsSchema } from "@/amplify/data/resource";
import { useRouter } from 'next/navigation'
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {LoaderComponent} from "./components/LoaderComponent";
import {LandingPage} from "./components/landing-page";
import {Card} from "./types";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { CardContent, CardMain } from "./components/ui/card";
import { Brain, Users, Gamepad2, Share2 } from "lucide-react";
import Link from "next/link";

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
    gameId: "",
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
    console.log("Running handleGenerateWords!");

    if (gameState.gameId === "") {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 w-screen overflow-x-hidden">
      <main className="flex flex-col w-screen">
        {/* Beta Banner */}
        
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 w-screen">
          <div className="w-full max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="space-y-4 w-full">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  CODENAMES AI
                </h1>
                <p className="mx-auto max-w-[700px] text-zinc-400 md:text-xl">
                  Experience the classic word-guessing game powered by artificial intelligence. Play Codenames online across multiple devices on a shared board.
                </p>
              </div>
              <CardMain className="w-full max-w-sm bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-2">
                      <Input
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Enter Game Identifier"
                        type="text"
                        value={gameState.gameId}
                        onChange={handleGameIDChange}
                      />
                    </div>
                    <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleGenerateWords}>
                      Start Game
                    </Button>
                  </div>
                </CardContent>
              </CardMain>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-zinc-900 w-screen">
          <div className="w-full max-w-[1400px] mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-4 md:grid-cols-2">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 rounded-full bg-emerald-600/10">
                  <Brain className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">AI Powered</h3>
                <p className="text-center text-zinc-400">
                  Enhanced gameplay with intelligent AI spymasters
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 rounded-full bg-emerald-600/10">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Multiplayer</h3>
                <p className="text-center text-zinc-400">
                  Play with friends across different devices
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 rounded-full bg-emerald-600/10">
                  <Gamepad2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Easy to Play</h3>
                <p className="text-center text-zinc-400">
                  Simple interface with intuitive controls
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 rounded-full bg-emerald-600/10">
                  <Share2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Instant Sharing</h3>
                <p className="text-center text-zinc-400">
                  Share game rooms with a simple identifier
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Play Section */}
        <section className="py-20 w-screen">
          <div className="w-full max-w-[1400px] mx-auto px-6">
            <div className="text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How to Play
                </h2>
                <p className="mx-auto max-w-[700px] text-zinc-400 md:text-xl">
                  Get started with Codenames AI in three simple steps
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-4">
               
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-emerald-500">1</div>
                  <h3 className="text-xl font-bold">Create a Game</h3>
                  <p className="text-zinc-400">
                    Enter a unique game identifier to create a new game room
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-4xl font-bold text-emerald-500">2</div>
                  <h3 className="text-xl font-bold">Choose Categories</h3>
                  <p className="text-zinc-400">
                  Enter five categories that will be used to generate the game board with words related to your selections.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-emerald-500">3</div>
                  <h3 className="text-xl font-bold">Share with Friends</h3>
                  <p className="text-zinc-400">
                    Send the game identifier to friends you want to play with
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-emerald-500">4</div>
                  <h3 className="text-xl font-bold">Start Playing</h3>
                  <p className="text-zinc-400">
                    Join the game and start guessing words with your team
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-zinc-900 w-screen">
          <div className="w-full max-w-[1400px] mx-auto px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Play?
              </h2>
              <p className="mx-auto max-w-[600px] text-zinc-400 md:text-xl">
                Start a new game now and challenge your friends to a battle of words and wit.
              </p>
              <CardMain className="w-full max-w-sm bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-2">
                      <Input
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="Enter Game Identifier"
                        type="text"
                        value={gameState.gameId}
                        onChange={handleGameIDChange}
                      />
                    </div>
                    <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleGenerateWords}>
                      Start Game
                    </Button>
                  </div>
                </CardContent>
              </CardMain>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-800 w-screen">
        <div className="w-full max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-zinc-400">
              © {new Date().getFullYear()} Codenames AI. All rights reserved.
            </p>
            <nav className="flex gap-4">
              <Link className="text-sm hover:text-emerald-400 text-zinc-400" href="#">
                Privacy Policy
              </Link>
              <Link className="text-sm hover:text-emerald-400 text-zinc-400" href="#">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}



