"use client";


import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { GameSessionsSchema } from "@/amplify/data/resource";
import "../app.css";
import "../globals.css"
import { Amplify } from "aws-amplify";
import { useRouter } from 'next/navigation'
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Button } from "../components/ui/button";
import { BetaBadge } from "../components/ui/beta-badge";
import { Input } from "../components/ui/input";
import {Card} from "../types"
import { Loader2 } from "lucide-react";

Amplify.configure(outputs);


const dynamoDbClient = generateClient<GameSessionsSchema>();

export default function Page({ params }: { params: { gameId: string } }) {

  const router = useRouter();

  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Full URL, including domain
      setFullUrl(window.location.href);
    }
  }, [router]);

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
  //Updates to ref will not re-render UI components 
  const spymasterViewRef = useRef(spymasterView);

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
        console.log("New Score Red: " + data.RedCardsLeft + "Blue: " + data.BlueCardsLeft +
           " spyMasterView" + spymasterViewRef.current)
        
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
  
      // Check if there were any errors
      if (errors) {
        console.error('Errors occurred during query:', errors);
        throw new Error('Failed to fetch game data.');
      }
  
      // Check if any game data was found
      if (!gameData || gameData.length === 0) {
        throw new Error('No game data found for the provided GameID, please start new game.');
      }

      const latestGameRecord = gameData[0]

      // Log data for debugging since it is present 
      console.log("fetched cards data: " + latestGameRecord)

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
    if (spymasterViewRef.current) {
      console.log("REVEAL DISABLED FOR SPY MASTER")
      return
    }
    const newCards = [...gameState.cards];
    //card is reference not a copy 
    //This means modifying card will also modify the object within the newCards array.
    const card = newCards[index];
    let newTeam = gameState.currentTeam;

    //Updates the card count 
    if (!card.revealed) {
      card.revealed = true;
      if (card.type === "assassin") {
        endGame(gameState.currentTeam === "red" ? "blue" : "red");
      } else if (gameState.currentTeam !== card.type) {
        //if selecting neutral or opponent teams card then end turn 
        newTeam =  (newTeam === "red" ? "blue" : "red")
        console.log("Selected wrong color end turn")
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
          totalCardsLeft: prevState.totalCardsLeft - 1,
          currentTeam: newTeam
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
      console.log("New Team", updatedGameState.currentTeam);

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

  function createBoard(words: string[], isNewGame = true): Card[] {
    let shuffledWords = words;
    if (isNewGame) { 
      // Shuffle words for new board creation only 
      shuffledWords = shuffleArray(words).slice(0, 25);
    }
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
  function createNewCode(words: string[]) {
    let shuffledCards;
    if (words.length === 0) { 
      console.log("Shuffle Board words is empty: " + words)
      //set words 
      const newWords: string[] = [];
      gameState.cards.forEach((card) => {
        newWords.push(card.word); // Assuming 'word' property exists in Card object
      });

      setWords(newWords);
      shuffledCards = createBoard(newWords, false)
    } else {
      shuffledCards = createBoard(words, false)
    }

    console.log("Shuffle Board with: " + shuffledCards)

    setGameState((prevState) => ({
      ...prevState,
      cards: shuffledCards
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
    toggleAllCardsVisibility(true) //once game ends reveal board
  }

  function spyMaster() {
   setSpymasterView(!spymasterView)
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
  
  //ToDo: [cleanup] this effect is no longer being used 
  useEffect(() => {
    spymasterViewRef.current = spymasterView;
    console.log("spy master value: " + spymasterViewRef.current)
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
      console.log("Words from OpenAI: " + parsedWords)
  
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
    <main className="max-h-screen bg-black text-white p-4 md:p-8 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            CODENAMES AI
          </h1>
          <BetaBadge />
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-zinc-900/50 p-6 rounded-lg backdrop-blur">
          <p className="mb-2">
            Send this link to friends:{" "}
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
              {fullUrl}
            </a>
          </p>
          <p className="text-gray-400">
            Enter below categories then click 'Start' to create a new board.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            id="category1"
            placeholder="Category 1"
            value={categories.category1}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
          <Input
            type="text"
            id="category2"
            placeholder="Category 2"
            value={categories.category2}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
          <Input
            type="text"
            id="category3"
            placeholder="Category 3"
            value={categories.category3}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
          <Input
            type="text"
            id="category4"
            placeholder="Category 4"
            value={categories.category4}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
          <Input
            type="text"
            id="category5"
            placeholder="Category 5"
            value={categories.category5}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
          <Button 
            onClick={handleGenerateWords}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Start
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}

         {/* Score Board */}
        <div className="bg-zinc-900/50 p-4 rounded-lg flex justify-between items-center">
          <span className="text-lg font-semibold">
            {`${gameState.currentTeam.charAt(0).toUpperCase() + gameState.currentTeam.slice(1)} Team's Turn`}
          </span>
          <div>
            <span className="text-red-500 font-bold text-xl mr-2">{gameState.redCardsLeft}</span>
            <span className="text-blue-500 font-bold text-xl">{gameState.blueCardsLeft}</span>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-5 gap-2 landscape:gap-2 px-4 landscape:px-0 max-w-2xl mx-auto">
          {gameState.cards.map((card, i) => (
            <div
              key={i}
              onClick={() => revealCard(i)}
              className={`
               aspect-[4/3] flex items-center justify-center p-1 sm:p-2 rounded-lg text-center cursor-pointer transition-all
               text-xs sm:text-sm md:text-base font-medium overflow-hidden
                ${card.revealed
                  ? card.type === 'red' 
                    ? 'bg-red-600 text-white'
                    : card.type === 'blue'
                    ? 'bg-blue-600 text-white'
                    : card.type === 'black'
                    ? 'bg-black text-white'
                    : 'bg-yellow-600 text-black'
                  : spymasterView
                  ? card.type === 'red'
                    ? 'bg-red-900/50 text-white'
                    : card.type === 'blue'
                    ? 'bg-blue-900/50 text-white'
                    : card.type === 'black'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-yellow-900/50 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }
              `}
            >
              <span className="break-words px-1 text-center">{card.word}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center space-x-4">
          {spymasterView && (
            <Button
              onClick={() => createNewCode(words)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              New Code
            </Button>
          )}
          <Button
            onClick={endTurn}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            End Turn
          </Button>
          <Button
            onClick={() => {
              spyMaster()
              setSpymasterView(!spymasterView)
            }}
            className={`${
              spymasterView
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white`}
          >
            {spymasterView ? 'Player View' : 'Spy Master'}
          </Button>
        </div>
      </div>
     
     
    </main>
  )
}