import React from 'react';

interface Element {
  name: string;
  isDiscovered: boolean;
  count: number;
}

interface Recipe {
  name: string;
  pattern: (string | null)[];
}

interface RecipeBookProps {
  elements: Record<string, Element>;
  recipes: Recipe[];
  onClose: () => void; // 모달 닫기 함수
}

const RecipeBook: React.FC<RecipeBookProps> = ({ elements, recipes, onClose }) => {
  const discoveredRecipes = recipes.filter(recipe => elements[recipe.name]?.isDiscovered);

  return (
    <div className="modal-overlay">
      <div className="modal-content bg-gray-800 p-6 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-2xl font-bold">Recipe Book</h2>
          <button 
            onClick={onClose}
            className="text-white text-xl font-bold px-2 py-1 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            X
          </button>
        </div>
        
        <div className="elements-list grid grid-cols-1 gap-2 max-h-96 overflow-y-auto"> {/* 스크롤 가능하도록 */}
          {discoveredRecipes.length === 0 ? (
            <p className="text-gray-400">No recipes discovered yet.</p>
          ) : (
            discoveredRecipes.map((recipe, index) => (
              <div key={index} className="bg-gray-700 p-3 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold">{elements[recipe.name]?.name}</h3>
                <p className="text-sm text-gray-300">
                  {recipe.pattern
                    .filter(item => item !== null)
                    .map(item => elements[item!]?.name)
                    .join(' + ')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeBook;
