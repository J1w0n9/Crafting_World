import { useState, useEffect } from 'react';
import ElementList from './components/ElementList';
import CraftingGrid from './components/CraftingGrid';
import InventoryList from './components/InventoryList';
import Auth from './components/Auth';
import RecipeBook from './components/RecipeBook';
import { supabase } from './supabaseClient';
import RecipeBookIcon from './assets/icons/recipe-book.svg';
// import { Session } from '@supabase/supabase-js'; // Session 타입 임포트 문제로 임시 주석 처리 또는 제거

// --- 1. 데이터 구조 정의 ---

interface Element {
  name: string;
  isDiscovered: boolean;
  count: number;
}

interface Recipe {
  name: string;
  pattern: (string | null)[];
}

// --- 2. 메인 게임 컴포넌트 ---

export default function App() {
  // --- 3. 상태 관리 (useState) ---

  const [session, setSession] = useState<any | null>(null); // Session 타입 문제로 임시로 any 사용
  const [elements, setElements] = useState<Record<string, Element>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gridSlots, setGridSlots] = useState<(string | null)[]>(Array(9).fill(null));
  const [message, setMessage] = useState<string>("Click an element to add it to the crafting grid!");
  const [showRecipeModal, setShowRecipeModal] = useState(false); // 레시피 모달 상태

  // --- 4. 인증 상태 관리 (useEffect) ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 5. 데이터 로딩 (useEffect) ---
  useEffect(() => {
    if (!session) {
      // 세션이 없으면 초기 데이터로 설정 (로그인 페이지에서 사용)
      setElements(INITIAL_ELEMENTS_HARDCODED);
      setRecipes(RECIPES_HARDCODED);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Elements 데이터 가져오기 (기본 데이터)
        const { data: baseElementsData, error: baseElementsError } = await supabase
          .from('elements')
          .select('*');

        if (baseElementsError) throw baseElementsError;

        const initialElements: Record<string, Element> = {};
        baseElementsData.forEach((el: any) => {
          initialElements[el.key] = {
            name: el.name,
            isDiscovered: el.is_discovered,
            count: el.count === -1 ? Infinity : el.count, // -1을 Infinity로 변환
          };
        });

        // Recipes 데이터 가져오기
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('*');

        if (recipesError) throw recipesError;

        const initialRecipes: Recipe[] = recipesData.map((rec: any) => ({
          name: rec.name,
          pattern: rec.pattern,
        }));
        setRecipes(initialRecipes);

        // 사용자별 Elements 데이터 가져오기
        const { data: userElementsData, error: userElementsError } = await supabase
          .from('user_elements')
          .select('*')
          .eq('user_id', session.user.id);

        if (userElementsError) throw userElementsError;

        // 기본 데이터와 사용자 데이터를 병합
        const mergedElements = { ...initialElements };
        userElementsData.forEach((userEl: any) => {
          if (mergedElements[userEl.element_key]) {
            mergedElements[userEl.element_key] = {
              ...mergedElements[userEl.element_key],
              isDiscovered: userEl.is_discovered,
              count: userEl.count === -1 ? Infinity : userEl.count, // -1을 Infinity로 변환
            };
          }
        });
        setElements(mergedElements);

      } catch (err: any) {
        console.error('Error fetching data:', err.message);
        setError('Failed to load game data. Please check your Supabase connection and tables.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session]);

  // 로딩 중 또는 에러 발생 시 UI
  if (loading) {
    return <div className="app-container bg-gray-900 text-white min-h-screen p-4 flex items-center justify-center text-2xl">Loading...</div>;
  }

  if (error) {
    return <div className="app-container bg-gray-900 text-white min-h-screen p-4 flex items-center justify-center text-2xl text-red-500">{error}</div>;
  }

  // 세션이 없으면 Auth 컴포넌트 렌더링
  if (!session) {
    return <Auth />;
  }

  // 기본 원소 키 목록 (하드코딩 유지, Supabase에서 가져올 수도 있음)
  const baseElementsKeys = ["water", "fire", "air", "earth"];

  // 기본 원소 (무한 갯수)
  const baseElementsForDisplay = Object.entries(elements)
    .filter(([key, data]) => baseElementsKeys.includes(key) && data.isDiscovered)
    .map(([key]) => key);

  // 인벤토리 원소 (조합으로 만들어진, 갯수가 0보다 큰 원소)
  const inventoryElementsForDisplay = Object.entries(elements)
    .filter(([key, data]) => !baseElementsKeys.includes(key) && data.isDiscovered && data.count > 0)
    .map(([key]) => key);

  // --- 6. 이벤트 핸들러 ---

  const handleElementClick = (elementKey: string) => {
    const newGrid = [...gridSlots];
    const emptySlotIndex = newGrid.findIndex(slot => slot === null);

    // 원소 갯수 확인 (기본 원소는 무한)
    if (elements[elementKey].count === 0 && elements[elementKey].count !== Infinity) {
      setMessage(`You don't have any ${elements[elementKey].name} left.`);
      return;
    }

    if (emptySlotIndex !== -1) {
      newGrid[emptySlotIndex] = elementKey;
      setGridSlots(newGrid);
      setMessage(`${elements[elementKey].name} added to the grid.`);

      // 기본 원소가 아닌 경우 갯수 감소
      if (elements[elementKey].count !== Infinity) {
        setElements(prevElements => ({
          ...prevElements,
          [elementKey]: { ...prevElements[elementKey], count: prevElements[elementKey].count - 1 }
        }));
      }
    } else {
      setMessage("Crafting grid is full.");
    }
  };

  const handleGridClick = (index: number) => {
    const elementToClear = gridSlots[index];
    if (elementToClear) {
      const newGrid = [...gridSlots];
      newGrid[index] = null;
      setGridSlots(newGrid);
      setMessage(`${elements[elementToClear].name} removed from the grid.`);

      // 기본 원소가 아닌 경우 갯수 증가 (그리드에서 제거 시)
      if (elements[elementToClear].count !== Infinity) {
        setElements(prevElements => ({
          ...prevElements,
          [elementToClear]: { ...prevElements[elementToClear], count: prevElements[elementToClear].count + 1 }
        }));
      }
    }
  };

  const handleCraft = () => {
    const currentGridElements = gridSlots.filter((item): item is string => item !== null).sort();

    if (currentGridElements.length === 0) {
      setMessage("No elements to craft.");
      return;
    }

    const recipe = recipes.find(r => { // recipes 상태 변수 사용
      const recipeElements = r.pattern.filter((item): item is string => item !== null).sort();
      // 원소의 갯수와 종류가 일치하는지 확인
      return recipeElements.length === currentGridElements.length &&
             recipeElements.every((val, index) => val === currentGridElements[index]);
    });

    if (recipe) {
      const newElementName = recipe.name;
      const newElementData = elements[newElementName];

      setMessage(`Congratulations! You discovered a new element: "${newElementData.name}"!`);

      // 새로운 상태 객체를 한 번에 업데이트
      setElements(prevElements => {
        const newElementsState = { ...prevElements };

        // 1. 새로운 원소의 isDiscovered 상태를 true로, 갯수를 1 증가
        newElementsState[newElementName] = {
          ...newElementsState[newElementName],
          isDiscovered: true,
          count: newElementsState[newElementName].count + 1
        };
        
        // 2. 조합에 사용된 원소들 갯수 감소 (기본 원소 제외)
        gridSlots.forEach(usedElementKey => {
          if (usedElementKey && newElementsState[usedElementKey].count !== Infinity) {
            newElementsState[usedElementKey] = {
              ...newElementsState[usedElementKey],
              count: newElementsState[usedElementKey].count - 1
            };
          }
        });
        return newElementsState;
      });

      setGridSlots(Array(9).fill(null));
    } else {
      setMessage("Nothing happened. Try a different combination.");
      setGridSlots(Array(9).fill(null));
    }
  };

  const handleClearGrid = () => {
    // 그리드에 있던 원소들 갯수 복구 (기본 원소 제외)
    gridSlots.forEach(elementKey => {
      if (elementKey && elements[elementKey].count !== Infinity) {
        setElements(prevElements => ({
          ...prevElements,
          [elementKey]: { ...prevElements[elementKey], count: prevElements[elementKey].count + 1 }
        }));
      }
    });
    setGridSlots(Array(9).fill(null));
    setMessage("Crafting grid has been cleared.");
  };

  const handleSaveGame = async () => {
    if (!session) {
      setMessage("Please log in to save your game.");
      return;
    }

    setMessage("Saving game...");
    try {
      const userElementsToSave = Object.entries(elements)
        .filter(([, data]) => data.count !== Infinity) // 무한대 원소는 저장하지 않음
        .map(([key, data]) => ({
          user_id: session.user.id,
          element_key: key,
          is_discovered: data.isDiscovered,
          count: data.count,
        }));

      const { error: upsertError } = await supabase
        .from('user_elements')
        .upsert(userElementsToSave, { onConflict: 'user_id,element_key' });

      if (upsertError) throw upsertError;

      setMessage("Game saved successfully!");
    } catch (error: any) {
      console.error('Error saving game:', error.message);
      setMessage(`Error saving game: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    setMessage("Logging out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMessage("Logged out successfully!");
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      setMessage(`Error logging out: ${error.message}`);
    }
  };

  // --- 7. UI 렌더링 (JSX) ---

  return (
    <div className="app-container bg-gray-900 text-white min-h-screen p-4 flex font-minecraft">
      <ElementList 
        elements={elements} 
        displayedElements={baseElementsForDisplay}
        title="Base Elements"
        handleElementClick={handleElementClick} 
      />
      {/* Recipe Book Button */}
      <div className="recipe-book-button-container ml-4">
        <button
          onClick={() => setShowRecipeModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2"
        >
          <img src={RecipeBookIcon} alt="Recipe Book" className="w-6 h-6" />
        </button>
      </div>

      {showRecipeModal && (
        <RecipeBook 
          elements={elements} 
          recipes={recipes} 
          onClose={() => setShowRecipeModal(false)}
        />
      )}

      <CraftingGrid 
        elements={elements} 
        gridSlots={gridSlots} 
        message={message} 
        handleGridClick={handleGridClick} 
        handleCraft={handleCraft} 
        handleClearGrid={handleClearGrid} 
        handleSaveGame={handleSaveGame}
      />
      {/* Inventory and Discord/Logout Buttons Container */}
      <div className="flex flex-col ml-4"> {/* Changed to flex-col for vertical stacking */}
        <div className="flex gap-2 mb-4"> {/* Discord & Logout buttons, added mb-4 for spacing */}
          <button
            onClick={() => window.open('https://discord.gg/fGYPzUCWry', '_blank')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2"
          >
            <span>Join Discord</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Logout
          </button>
        </div>
        <InventoryList
          elements={elements}
          displayedElements={inventoryElementsForDisplay}
          title="Inventory"
          handleElementClick={handleElementClick}
        />
      </div>
    </div>
  );
}

// 하드코딩된 초기 데이터 (세션 없을 때 사용)
const INITIAL_ELEMENTS_HARDCODED: Record<string, Element> = {
  water: { name: "Water", isDiscovered: true, count: Infinity },
  fire: { name: "Fire", isDiscovered: true, count: Infinity },
  air: { name: "Air", isDiscovered: true, count: Infinity },
  earth: { name: "Earth", isDiscovered: true, count: Infinity },
  steam: { name: "Steam", isDiscovered: false, count: 0 },
  lava: { name: "Lava", isDiscovered: false, count: 0 },
  sea: { name: "Sea", isDiscovered: false, count: 0 },
  dust: { name: "Dust", isDiscovered: false, count: 0 },
  mud: { name: "Mud", isDiscovered: false, count: 0 }, // Changed from plant to mud
  obsidian: { name: "Obsidian", isDiscovered: false, count: 0 },
};

const RECIPES_HARDCODED: Recipe[] = [
  { name: "steam", pattern: ["fire", "water", null, null, null, null, null, null, null] },
  { name: "lava", pattern: ["earth", "fire", null, null, null, null, null, null, null] },
  { name: "sea", pattern: ["water", "water", null, null, null, null, null, null, null] },
  { name: "dust", pattern: ["air", "earth", null, null, null, null, null, null, null] },
  { name: "mud", pattern: ["earth", "water", null, null, null, null, null, null, null] }, // Changed from plant to mud
  { name: "obsidian", pattern: ["lava", "water", null, null, null, null, null, null, null] },
];
