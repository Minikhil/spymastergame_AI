"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

// export default function App() {
//   //const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

//   // useEffect(() => {
//   //   listTodos();
//   // }, []);

//   // function listTodos() {
//   //   client.models.Todo.observeQuery().subscribe({
//   //     next: (data) => setTodos([...data.items]),
//   //   });
//   // }

//   // async function createTodo() {
//   //   const content = window.prompt("Todo content");
//   //   if (content) {
//   //     client.models.Todo.create({
//   //       content,
//   //     });
//   //   }
//   // }

//   // function deleteTodo(id: string) {
//   //   client.models.Todo.delete({ id });
//   // }

//   //code names 

//   const [words, setWords] = useState<string[]>([]);
//   const [gameState, setGameState] = useState({
//     currentTeam: "red",
//     redCardsLeft: 9,
//     blueCardsLeft: 8,
//     cards: [],
//   });
//   const [loading, setLoading] = useState(false);
//   const [spymasterView, setSpymasterView] = useState(false);


//   async function generateWordsFromCategories(categories: string[]) {
//     const response = await fetch('/api/openai', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ categories }),
//     });
  
//     if (!response.ok) {
//       throw new Error('Failed to fetch words');
//     }
  
//     const words = await response.json();
//     return JSON.parse(words);
//   }
  

//   async function handleGenerateWords() {
//     const categories = [
//       (document.getElementById("category1") as HTMLInputElement)?.value,
//       (document.getElementById("category2") as HTMLInputElement)?.value,
//       (document.getElementById("category3") as HTMLInputElement)?.value,
//       (document.getElementById("category4") as HTMLInputElement)?.value,
//       (document.getElementById("category5") as HTMLInputElement)?.value,
//     ].filter((cat) => cat.trim() !== "");

//     if (categories.length !== 5) {
//       alert("Please enter all 5 categories.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const generatedWords = await generateWordsFromCategories(categories);
//       setWords(generatedWords.flat());
//       createBoard(generatedWords.flat());
//     } catch (error) {
//       console.error("Error generating words:", error);
//       alert("There was an error generating words. Please try again.");
//     } finally {
//       setLoading(false);
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

//     setGameState((prevState) => ({
//       ...prevState,
//       cards: shuffledWords.map((word, i) => ({
//         word,
//         type: cardTypes[i],
//         revealed: false,
//       })),
//     }));
//   }

//   function revealCard(index: number) {
//     const newCards = [...gameState.cards];
//     const card = newCards[index];

//     if (!card.revealed) {
//       card.revealed = true;
//       if (card.type === "assassin") {
//         endGame(gameState.currentTeam === "red" ? "blue" : "red");
//       } else {
//         updateCardCount(card.type);
//       }
//     }

//     setGameState((prevState) => ({
//       ...prevState,
//       cards: newCards,
//     }));
//   }

//   function updateCardCount(type: string) {
//     if (type === "red") {
//       setGameState((prevState) => ({
//         ...prevState,
//         redCardsLeft: prevState.redCardsLeft - 1,
//       }));
//     } else if (type === "blue") {
//       setGameState((prevState) => ({
//         ...prevState,
//         blueCardsLeft: prevState.blueCardsLeft - 1,
//       }));
//     }
//   }

//   function endTurn() {
//     setGameState((prevState) => ({
//       ...prevState,
//       currentTeam: prevState.currentTeam === "red" ? "blue" : "red",
//     }));
//   }

//   function endGame(winner: string) {
//     alert(`${winner.charAt(0).toUpperCase() + winner.slice(1)} team wins!`);
//     createBoard(words); // Reset board
//   }

//   function shuffleArray(array: any[]) {
//     for (let i = array.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [array[i], array[j]] = [array[j], array[i]];
//     }
//     return array;
//   }

//   return (
//     <main>
//       {/* <h1>My todos</h1>
//       <button onClick={createTodo}>+ new</button>
//       <ul>
//         {todos.map((todo) => (
//           <li onClick={() => deleteTodo(todo.id)} key={todo.id}>
//             {todo.content}
//           </li>
//         ))}
//       </ul> */}
//       <div>
//         <h2>Codenames AI Devo</h2>
//         <div className="category-input">
//           <input type="text" id="category1" placeholder="Category 1" />
//           <input type="text" id="category2" placeholder="Category 2" />
//           <input type="text" id="category3" placeholder="Category 3" />
//           <input type="text" id="category4" placeholder="Category 4" />
//           <input type="text" id="category5" placeholder="Category 5" />
//           <button onClick={handleGenerateWords}>Generate Words</button>
//         </div>
//         {loading && <div id="loading-indicator">Generating words...</div>}
//         <div className="spymaster-toggle">
//           <label>
//             <input
//               type="checkbox"
//               checked={spymasterView}
//               onChange={(e) => setSpymasterView(e.target.checked)}
//             />
//             Spymaster View
//           </label>
//         </div>
//         <div className="turn-indicator">
//           {`${gameState.currentTeam.charAt(0).toUpperCase() +
//             gameState.currentTeam.slice(1)} Team's Turn`}
//         </div>
//         <div className="game-board">
//           {gameState.cards.map((card, i) => (
//             <div
//               key={i}
//               className={`card ${card.revealed ? card.type : ""}`}
//               onClick={() => revealCard(i)}
//             >
//               {card.word}
//             </div>
//           ))}
//         </div>
//         <div className="controls">
//           <button onClick={() => createBoard(words)}>New Game</button>
//           <button onClick={endTurn}>End Turn</button>
//         </div>
//       </div>
//     </main>
//   );
// }

type Card = {
  word: string;
  type: string; // 'red', 'blue', 'neutral', or 'assassin'
  revealed: boolean;
};

export default function App() {
  const [categories, setCategories] = useState({
    category1: "",
    category2: "",
    category3: "",
    category4: "",
    category5: "",
  });
  const [words, setWords] = useState<string[]>([]);

  const [gameState, setGameState] = useState<{
    currentTeam: string;
    redCardsLeft: number;
    blueCardsLeft: number;
    cards: Card[]; // Explicitly typing the cards array
  }>({
    currentTeam: "red",
    redCardsLeft: 9,
    blueCardsLeft: 8,
    cards: [],
  });

  const [loading, setLoading] = useState(false);
  const [spymasterView, setSpymasterView] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCategories((prevCategories) => ({
      ...prevCategories,
      [id]: value,
    }));
  };

  async function handleGenerateWords() {
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
  
      // Parse the response properly
      const generatedWords = await response.json();
      
      // Ensure the response is an array, and then use flat()
      const parsedWords = JSON.parse(generatedWords);
  
      if (Array.isArray(parsedWords)) {
        setWords(parsedWords.flat());
        createBoard(parsedWords.flat());
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
      })),
    }));
  }

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
  }

  function updateCardCount(type: string) {
    if (type === "red") {
      setGameState((prevState) => ({
        ...prevState,
        redCardsLeft: prevState.redCardsLeft - 1,
      }));
    } else if (type === "blue") {
      setGameState((prevState) => ({
        ...prevState,
        blueCardsLeft: prevState.blueCardsLeft - 1,
      }));
    }
  }

  function endTurn() {
    setGameState((prevState) => ({
      ...prevState,
      currentTeam: prevState.currentTeam === "red" ? "blue" : "red",
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

  return (
    <main>
      <h2>Codenames AI Game</h2>
      <div className="category-input">
        <input type="text" id="category1" placeholder="Category 1" value={categories.category1} onChange={handleChange} />
        <input type="text" id="category2" placeholder="Category 2" value={categories.category2} onChange={handleChange} />
        <input type="text" id="category3" placeholder="Category 3" value={categories.category3} onChange={handleChange} />
        <input type="text" id="category4" placeholder="Category 4" value={categories.category4} onChange={handleChange} />
        <input type="text" id="category5" placeholder="Category 5" value={categories.category5} onChange={handleChange} />
        <button onClick={handleGenerateWords}>Generate Words</button>
      </div>

      {loading && <div id="loading-indicator">Generating words...</div>}

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



