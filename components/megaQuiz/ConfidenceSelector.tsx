import React from 'react';

const levels = ["Very High", "High", "Medium", "Low", "Guess"];


const ConfidenceSelector = ({ value, onChange }: { value: string, onChange: (level: string) => void }) => {
  return (
    <div className="flex flex-col items-start gap-2 px-4 py-2 bg-gray-900 border-2 border-blue-400 rounded-lg shadow-md">
      <label className="text-yellow-300 font-semibold">Confidence Level:</label>
      <div className="flex gap-2 mt-1">
        {levels.map(l => (
          <button
            key={l}
            className={`px-3 py-1 rounded-md border-2 font-medium transition-all
              ${value === l
                ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg'
                : 'bg-gray-800 border-blue-400 text-yellow-100 hover:bg-blue-900 hover:border-yellow-400'}`}
            onClick={() => onChange(l)}
            type="button"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConfidenceSelector;
