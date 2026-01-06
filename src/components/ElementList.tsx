import React from 'react';

interface Element {
  name: string;
  isDiscovered: boolean;
  count: number;
}

interface ElementListProps {
  elements: Record<string, Element>;
  displayedElements: string[];
  title: string;
  handleElementClick: (elementKey: string) => void;
}

const ElementList: React.FC<ElementListProps> = ({ elements, displayedElements, title, handleElementClick }) => {
  return (
    <aside className="elements-panel bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">{title}</h2>
      <div className="elements-list grid grid-cols-2 gap-2">
        {displayedElements.map((key) => (
          <button 
            key={key} 
            onClick={() => handleElementClick(key)}
            className="relative bg-[#4931FF] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex flex-col items-center justify-center"
          >
            <span className="text-lg font-semibold">{elements[key].name}</span>
            {elements[key].count !== Infinity && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs -mt-2 -mr-2">
                {elements[key].count}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default ElementList;
