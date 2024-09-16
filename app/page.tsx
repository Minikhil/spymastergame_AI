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


// const dynamoDbClient = generateClient<GameSessionsSchema>();

// type Card = {
//   word: string;
//   type: string; // 'red', 'blue', 'neutral', or 'assassin'
//   revealed: boolean;
// };

// export default function App() {

//   const router = useRouter(); // Use useRouter for navigation
//   const [categories, setCategories] = useState({
//     category1: "",
//     category2: "",
//     category3: "",
//     category4: "",
//     category5: "",
//   });
//   const [words, setWords] = useState<string[]>([]);

//   const [gameState, setGameState] = useState<{
//     gameId: string | undefined;
//     currentTeam: string;
//     redCardsLeft: number;
//     blueCardsLeft: number;
//     totalCardsLeft: number,
//     cards: Card[]; // Explicitly typing the cards array
//   }>({
//     gameId: undefined, // Initial empty gameID
//     currentTeam: "red",
//     redCardsLeft: 9,
//     blueCardsLeft: 8,
//     totalCardsLeft: (Object.values(categories).length * Object.values(categories).length),
//     cards: [], // Initial empty gameID
//   });

//   const [loading, setLoading] = useState(false);
//   const [spymasterView, setSpymasterView] = useState(false);

//   // Handle gameID input change and update gameState
//   const handleGameIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setGameState((prevState) => ({
//       ...prevState,
//       gameId: e.target.value,  // Updating gameId in gameState
//     }));
//   };

//   // Handle categories input change and update categories state
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { id, value } = e.target;
//     setCategories((prevCategories) => ({
//       ...prevCategories,
//       [id]: value,
//     }));
//   };

//   async function handleGenerateWords() {
    
//     if (gameState.gameId === undefined) {
//       alert("Please enter game ID.");
//       return;
//     }

//     const categoryValues = Object.values(categories).filter((cat) => cat.trim() !== "");
  
//     if (categoryValues.length < 5) {
//       alert("Please enter all 5 categories.");
//       return;
//     }
  
//     setLoading(true);
  
//     try {
//       const response = await fetch("/api/openai", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ categories: categoryValues }),
//       });
  
//       if (!response.ok) {
//         throw new Error("Failed to fetch words");
//       }
  
//       // Parse the response properly
//       const generatedWords = await response.json();
      
//       // Ensure the response is an array, and then use flat()
//       const parsedWords = JSON.parse(generatedWords);
  
//       if (Array.isArray(parsedWords)) {
//         setWords(parsedWords.flat());
//         createBoard(parsedWords.flat());
//         insertNewGameToDynamo();
//       } else {
//         throw new Error("Invalid format of generated words");
//       }
//     } catch (error) {
//       console.error("Error generating words:", error);
//       alert("There was an error generating words. Please try again.");
//     } finally {
//       setLoading(false);
//        // Redirect to the dynamic game page using the gameId
//        //router.push(`/${gameState.gameId}`);
//     }
//   }
  

//   function createBoard(words: string[]) {
//     const shuffledWords = shuffleArray(words).slice(0, 25);
//     const cardTypes = shuffleArray([
//       "red", "red", "red", "red", "red", "red", "red", "red", "red",
//       "blue", "blue", "blue", "blue", "blue", "blue", "blue", "blue",
//       "neutral", "neutral", "neutral", "neutral", "neutral", "neutral", "neutral",
//       "assassin",
//     ]);

//     // There is an issue with below function 
//     setGameState((prevState) => ({
//       ...prevState,
//       cards: shuffledWords.map((word, i) => ({
//         word,
//         type: cardTypes[i],
//         revealed: false,
//       })),
//     }));

//     console.log("Words Updated: " + JSON.stringify(words))
//     console.log("shuffledWords: " + shuffledWords)
//     //Issue is gameSate.cards isn't being set upon clikcing the generate button first time, but works on second try
//     console.log("Cards Updated: " + JSON.stringify(gameState.cards))
//   }

//   function shuffleArray(array: any[]) {
//     for (let i = array.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [array[i], array[j]] = [array[j], array[i]];
//     }
//     return array;
//   }

//   async function insertNewGameToDynamo() {
   
//     if (!gameState.gameId) {
//       alert("Please enter a game ID.");
//       return;
//     }
  
//     try {
//       console.log("Game State: " + JSON.stringify(gameState))
//       console.log("Insert Cards: " + JSON.stringify(gameState.cards));
//       await dynamoDbClient.models.GameSessions.create({
//         GameID: gameState.gameId,
//         CurrentTeam: gameState.currentTeam,
//         RedCardsLeft: gameState.redCardsLeft,
//         BlueCardsLeft: gameState.blueCardsLeft,
//         TotalCardsLeft: gameState.totalCardsLeft,
//         Categories: JSON.stringify(words), 
//         Cards: JSON.stringify(gameState.cards), 
//       });
  
//       console.log("New game record created successfully in DynamoDB");
//     } catch (error) {
//       console.error("Error creating game record in DynamoDB:", error);
//       alert("There was an error saving the game. Please try again.");
//     }
//   }

//   return (
//     <main>
//       <h2>Codenames AI Game</h2>
//       <div className="game-id-input">
//         <input
//           type="text"
//           id="gameId"
//           placeholder="Enter Game ID"
//           value={gameState.gameId}  // Controlled input
//           onChange={handleGameIDChange}
//         />
//       </div>

//       <div className="category-input">
//         <input type="text" id="category1" placeholder="Category 1" value={categories.category1} onChange={handleChange} />
//         <input type="text" id="category2" placeholder="Category 2" value={categories.category2} onChange={handleChange} />
//         <input type="text" id="category3" placeholder="Category 3" value={categories.category3} onChange={handleChange} />
//         <input type="text" id="category4" placeholder="Category 4" value={categories.category4} onChange={handleChange} />
//         <input type="text" id="category5" placeholder="Category 5" value={categories.category5} onChange={handleChange} />
//         <button onClick={handleGenerateWords}>Generate Words</button>
//       </div>

//       {loading && <div id="loading-indicator">Generating words...</div>}

//     </main>
//   );
// }

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
          
          // Pass updated state to Insert into DynamoDBn
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



