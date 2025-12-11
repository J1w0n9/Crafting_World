import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase.ts";
import ThemeToggle from "./ThemeToggle.tsx";

const initialElements = ["water", "fire", "earth", "air", "stone", "brick"];

// --- RECIPE DEFINITIONS ---
interface Recipe {
  result: string;
  shape?: (string | null)[];
  ingredients?: Record<string, number>;
}

const oldRecipes: Record<string, string> = {
    "fire+water": "steam", "earth+water": "mud", "air+fire": "smoke", "earth+fire": "lava",
    "air+lava": "stone", "mud+stone": "clay", "fire+stone": "metal", "air+steam": "cloud",
    "clay+fire": "brick", "brick+brick": "wall", "water+water": "sea", "cloud+water": "rain",
    "rain+wind": "hurricane", "air+air": "wind", "wind+water": "ice", "rain+earth": "plant",
    "plant+air": "oxygen", "plant+Sun": "oxygen", "oxygen+sea": "fish", "sea+ground": "beach",
    "beach+fish": "frog", "ground+plant": "forest", "frog+forest": "lizard", "earth+earth": "ground",
    "ground+ocean": "Earth", "Earth+oxygen": "atmosphere", "Earth+fire": "Sun", "fire+tree": "charcoal",
    "plant+plant": "tree", "fire+forest": "wildfire", "sea+sea": "ocean", "charcoal+fire": "energy",
    "energy+energy": "electricity", "beach+earth": "sand", "sand+fire": "glass", "atmosphere+ground": "planet",
    "Earth+planet":"Moon", "stone+stone":"pebble", "pebble+stone":"std toolkit", "std toolkit + fish":"meat",
    "std toolkit + frog":"meat", "std toolkit + lizard":"meat", "std toolkit + tree" : "wood",
    "meat + lizard" : "dinosaur", "dinosaur + air" : "bird", "bird + tree" : "nest",
    "frog+water": "frog egg", "lizard + nest": "egg", "bird + nest" : "egg", "bird + std toolkit" : "feather",
};

const convertOldRecipes = (): Recipe[] => {
  return Object.entries(oldRecipes).map(([key, result]) => {
    const ingredients = key.split("+").reduce((acc, part) => {
      const trimmed = part.trim();
      acc[trimmed] = (acc[trimmed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { result, ingredients };
  });
};

const recipes: Recipe[] = [
  { shape: ["brick", "brick", "brick", null, null, null, null, null, null], result: "wall" },
  { shape: [null, "stone", null, null, "fire", null, null, null, null], result: "lava" },
  ...convertOldRecipes(),
];

// --- CORE COMPONENT ---
export default function Alchemy() {
  const session = useSignal<Session | null>(null);
  const discovered = useSignal(new Set(initialElements));
  const isLoaded = useSignal(false);
  const saveError = useSignal<string | null>(null);
  const craftingGrid = useSignal<(string | null)[]>(Array(9).fill(null));
  const craftResult = useSignal<string | null>(null);
  const draggedItem = useSignal<{ name: string; fromIndex?: number } | null>(null);
  // 1. State for Recipe Book
  const discoveredRecipes = useSignal(new Set<string>());
  const showRecipeBook = useSignal(false);

  // 2. Update saveState
  const saveState = async () => {
    saveError.value = null;
    const user = session.value?.user;
    if (!isLoaded.value || !user) return;
    try {
      const response = await fetch("/api/gamestate", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          discovered_elements: Array.from(discovered.value),
          discovered_recipes: Array.from(discoveredRecipes.value),
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to save");
    } catch (error) {
      saveError.value = error.message;
    }
  };

  // 3. Update loadState
  useEffect(() => {
    const loadState = async (userId: string) => {
      try {
        const response = await fetch(`/api/gamestate?user_id=${userId}`);
        const data = await response.json();
        if (data) {
          discovered.value = new Set<string>(data.discovered_elements ?? initialElements);
          discoveredRecipes.value = new Set<string>(data.discovered_recipes ?? []);
        } else {
          discovered.value = new Set(initialElements);
          discoveredRecipes.value = new Set();
        }
      } catch (error) {
        console.error("Error loading state:", error);
      } finally {
        isLoaded.value = true;
      }
    };

    supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      session.value = currentSession;
      isLoaded.value = false;
      if (currentSession?.user) await loadState(currentSession.user.id);
      else {
        discovered.value = new Set(initialElements);
        discoveredRecipes.value = new Set();
        isLoaded.value = true;
      }
      craftingGrid.value = Array(9).fill(null);
      craftResult.value = null;
    });
  }, []);

  const handleLogout = () => supabase.auth.signOut();
  const handleDragStart = (name: string, fromIndex?: number) => draggedItem.value = { name, fromIndex };
  const handleGridDrop = (toIndex: number) => {
    if (!draggedItem.value) return;
    const newGrid = [...craftingGrid.value];
    if (draggedItem.value.fromIndex !== undefined) newGrid[draggedItem.value.fromIndex] = null;
    newGrid[toIndex] = draggedItem.value.name;
    craftingGrid.value = newGrid;
    draggedItem.value = null;
  };
  const clearGridSlot = (index: number) => {
    const newGrid = [...craftingGrid.value];
    newGrid[index] = null;
    craftingGrid.value = newGrid;
  };

  // 4. Update handleCraft
  const handleCraft = () => {
    const currentGrid = craftingGrid.value;
    
    const processSuccess = (recipe: Recipe, key: string) => {
      craftResult.value = recipe.result;
      if (!discovered.value.has(recipe.result)) {
        discovered.value = new Set(discovered.value).add(recipe.result);
      }
      if (!discoveredRecipes.value.has(key)) {
        discoveredRecipes.value = new Set(discoveredRecipes.value).add(key);
      }
      saveState();
      craftingGrid.value = Array(9).fill(null);
    };

    for (const recipe of recipes) {
      if (recipe.shape) {
        if (recipe.shape.every((v, i) => v === currentGrid[i])) {
          const key = `${recipe.shape.join(",")}=>${recipe.result}`;
          processSuccess(recipe, key);
          return;
        }
      }
    }

    const gridIngredients: Record<string, number> = {};
    let totalIngredients = 0;
    currentGrid.forEach(element => {
      if (element) {
        gridIngredients[element] = (gridIngredients[element] || 0) + 1;
        totalIngredients++;
      }
    });

    for (const recipe of recipes) {
      if (recipe.ingredients) {
        const recipeTotal = Object.values(recipe.ingredients).reduce((a, b) => a + b, 0);
        if (recipeTotal !== totalIngredients) continue;
        const match = Object.entries(recipe.ingredients).every(([key, count]) => gridIngredients[key] === count);
        if (match) {
          const key = Object.keys(recipe.ingredients).sort().join("+") + `=>${recipe.result}`;
          processSuccess(recipe, key);
          return;
        }
      }
    }

    craftResult.value = "nothing";
    setTimeout(() => { if (craftResult.value === "nothing") craftResult.value = null; }, 1000);
  };

  const takeResult = () => {
    if (craftResult.value && craftResult.value !== "nothing") craftResult.value = null;
  };

  if (!isLoaded.value) return <div class="w-full h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white">Loading...</div>;
  if (!session.value) return (
    <div class="w-full h-screen bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-900 dark:text-white">
      <h1 class="text-4xl font-bold mb-4">Welcome to Crafting World</h1>
      <p class="mb-8 text-lg">Please log in to save your progress.</p>
      <a href="/login" class="px-6 py-3 bg-indigo-600 text-white rounded-lg">Go to Login</a>
    </div>
  );

  return (
    <div class="flex w-full h-screen text-gray-900 dark:text-white font-sans">
      {/* 5. Recipe Book Modal */}
      {showRecipeBook.value && (
        <div class="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => showRecipeBook.value = false}>
          <div class="w-full max-w-2xl h-3/4 bg-gray-200 dark:bg-gray-900 rounded-lg shadow-2xl p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 class="text-3xl font-bold mb-4 text-center">Recipe Book</h2>
            <div class="flex-grow overflow-y-auto pr-4">
              <ul class="space-y-2">
                {[...discoveredRecipes.value].sort().map(key => {
                  const [ingredients, result] = key.split("=>");
                  return <li class="p-3 bg-gray-300 dark:bg-gray-800 rounded-lg">{ingredients.replace(/,/g, " ")} → <span class="font-bold text-indigo-500">{result}</span></li>
                })}
              </ul>
            </div>
            <button onClick={() => showRecipeBook.value = false} class="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg">Close</button>
          </div>
        </div>
      )}

      <div class="w-1/4 h-full bg-gray-200 dark:bg-gray-900 p-4 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">Elements</h2>
          {/* 5. Recipe Book Button */}
          <button onClick={() => showRecipeBook.value = true} class="p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600" title="Recipe Book">📖</button>
        </div>
        <div class="flex-grow overflow-y-auto">
          <div class="grid grid-cols-2 gap-2">
            {[...discovered.value].sort().map((name) => (
              <div key={name} draggable onDragStart={() => handleDragStart(name)} class="p-3 bg-gray-300 dark:bg-gray-700 rounded-lg text-center select-none cursor-grab">{name}</div>
            ))}
          </div>
        </div>
        <div class="flex-shrink-0 pt-4 border-t border-gray-300 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Logged in as: {session.value.user.email}</p>
          <button onClick={handleLogout} class="w-full px-4 py-2 bg-red-600 text-white rounded-lg">Logout</button>
        </div>
      </div>

      <div class="w-3/4 h-full flex flex-col items-center justify-center p-8 relative">
        <div class="absolute top-4 right-4"><ThemeToggle /></div>
        <h1 class="text-4xl font-bold mb-8">Crafting Bench</h1>
        <div class="flex items-center gap-8">
          <div class="grid grid-cols-3 gap-2 p-2 bg-gray-200 dark:bg-gray-900 rounded-lg" onDragOver={(e) => e.preventDefault()}>
            {craftingGrid.value.map((element, i) => (
              <div key={i} onDrop={() => handleGridDrop(i)} onDragOver={(e) => e.preventDefault()} class="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-md flex items-center justify-center text-lg font-bold border-2 border-transparent hover:border-indigo-500">
                {element && (
                  <div draggable onDragStart={() => handleDragStart(element, i)} onDblClick={() => clearGridSlot(i)} class="w-full h-full flex items-center justify-center cursor-grab bg-indigo-600 text-white rounded select-none" title="Double-click to remove">
                    {element}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={handleCraft} class="px-6 py-4 bg-green-600 text-white rounded-lg text-2xl font-bold">→</button>
          <div onClick={takeResult} class="w-24 h-24 bg-gray-200 dark:bg-gray-900 rounded-lg flex items-center justify-center text-lg font-bold border-2 border-gray-400 dark:border-gray-700">
            {craftResult.value && craftResult.value !== "nothing" && (
              <div class="w-full h-full flex items-center justify-center bg-indigo-600 text-white rounded">{craftResult.value}</div>
            )}
            {craftResult.value === "nothing" && (
              <div class="w-full h-full flex items-center justify-center text-red-500">Fail</div>
            )}
          </div>
        </div>
        {saveError.value && <p class="mt-4 text-red-500">Save Error: {saveError.value}</p>}
      </div>
    </div>
  );
}
