import React from 'react';


const Timer = ({ time }: { time: number }) => {
  const min = Math.floor(time / 60);
  const sec = time % 60;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-2 border-yellow-400 rounded-lg text-yellow-300 font-mono text-lg shadow-md">
      <span className="font-bold text-yellow-400">⏱️</span>
      <span>Time:</span>
      <span className="text-yellow-200">{min.toString().padStart(2, '0')}:{sec.toString().padStart(2, '0')}</span>
    </div>
  );
};

export default Timer;
