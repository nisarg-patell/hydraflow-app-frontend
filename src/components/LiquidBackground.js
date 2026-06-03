import React from 'react';

export default function LiquidBackground({ percentage }) {
  // Ensure percentage is between 5% and 100%
  const fillLevel = Math.max(5, Math.min(100, percentage));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
      <div 
        className="absolute bottom-0 left-[-50%] right-[-50%] bg-blue-500 transition-all duration-700 ease-out"
        style={{ 
          height: `${fillLevel}%`,
          filter: 'blur(8px)',
        }}
      >
        {/* Wave effect layer 1 */}
        <div className="absolute top-[-50px] left-0 w-full h-[100px] bg-blue-400/50 rounded-[50%] animate-wave-slow"></div>
        {/* Wave effect layer 2 */}
        <div className="absolute top-[-30px] left-[-20%] w-[150%] h-[100px] bg-blue-500/50 rounded-[40%] animate-wave-fast"></div>
      </div>
    </div>
  );
}
