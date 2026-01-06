import React from 'react';

interface Element {
  name: string;
  isDiscovered: boolean;
  count: number;
}

interface CraftingGridProps {
  elements: Record<string, Element>;
  gridSlots: (string | null)[];
  message: string;
  handleGridClick: (index: number) => void;
  handleCraft: () => void;
  handleClearGrid: () => void;
  handleSaveGame: () => Promise<void>; // 추가: 게임 저장 함수
}

const CraftingGrid: React.FC<CraftingGridProps> = ({
  elements,
  gridSlots,
  message,
  handleGridClick,
  handleCraft,
  handleClearGrid,
  handleSaveGame, // 추가
}) => {
  return (
    <main className="crafting-area flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Crafting World</h1>
      <div className="crafting-grid grid grid-cols-3 gap-2 w-96 h-96 bg-gray-700 p-2 rounded-lg">
        {gridSlots.map((elementKey, index) => (
          <div 
            key={index} 
            onClick={() => handleGridClick(index)} 
            className="grid-slot bg-gray-600 flex items-center justify-center rounded text-xl font-semibold cursor-pointer hover:bg-gray-500 transition-colors duration-200"
          >
            {elementKey && elements[elementKey].name}
          </div>
        ))}
      </div>

      <div className="controls flex justify-center gap-4 mt-6"> {/* justify-center 추가 */}
        <button 
          onClick={handleCraft}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Craft
        </button>
        <button 
          onClick={handleClearGrid}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Clear
        </button>
        <button
          onClick={handleSaveGame} // 추가: 게임 저장 버튼
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Save Game
        </button>
      </div>

      <div className="message-box mt-6 bg-gray-800 p-3 rounded-lg">
        <p className="text-lg">{message}</p>
      </div>
    </main>
  );
};

export default CraftingGrid;