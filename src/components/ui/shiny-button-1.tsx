import React, { useState } from 'react';

const GlowButton = ({ children = 'Book Em', onClick, disabled = false }: { 
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const [isFlashing, setIsFlashing] = useState(false);

  const handleClick = async () => {
    if (disabled || !onClick) return;
    
    // Trigger flashing animation
    setIsFlashing(true);
    
    // Execute the actual click handler
    await onClick();
    
    // Stop flashing after 3 seconds
    setTimeout(() => setIsFlashing(false), 3000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="relative flex items-center justify-center bg-transparent border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 group min-h-[60px]"
    >
      {/* Left Light (Red when flashing) */}
      <div 
        className={`w-20 h-14 rounded-l-2xl border-2 transition-all duration-300
                   ${disabled 
                     ? 'bg-gray-800 border-gray-700' 
                     : isFlashing 
                       ? 'animate-flashRed border-red-600' 
                       : 'bg-gray-900 border-gray-600 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] group-hover:border-white'}`}
        style={{
          boxShadow: isFlashing ? '0 0 30px rgba(255,0,0,0.8)' : undefined
        }}
      />
      
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span className="text-white font-bold text-sm px-4 drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]">{children}</span>
      </div>
      
      {/* Right Light (Blue when flashing) */}
      <div 
        className={`w-20 h-14 rounded-r-2xl border-2 border-l-0 transition-all duration-300
                   ${disabled 
                     ? 'bg-gray-800 border-gray-700' 
                     : isFlashing 
                       ? 'animate-flashBlue border-blue-600' 
                       : 'bg-gray-900 border-gray-600 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] group-hover:border-white'}`}
        style={{
          boxShadow: isFlashing ? '0 0 30px rgba(0,0,255,0.8)' : undefined
        }}
      />

      <style>{`
        @keyframes flashRed {
          0%, 100% { 
            background-color: #dc2626;
            box-shadow: 0 0 40px rgba(220, 38, 38, 1), 0 0 60px rgba(220, 38, 38, 0.6);
          }
          50% { 
            background-color: #991b1b;
            box-shadow: 0 0 20px rgba(153, 27, 27, 0.8);
          }
        }
        @keyframes flashBlue {
          0%, 100% { 
            background-color: #1e3a8a;
            box-shadow: 0 0 20px rgba(30, 58, 138, 0.8);
          }
          50% { 
            background-color: #2563eb;
            box-shadow: 0 0 40px rgba(37, 99, 235, 1), 0 0 60px rgba(37, 99, 235, 0.6);
          }
        }
        .animate-flashRed {
          animation: flashRed 0.5s ease-in-out infinite;
        }
        .animate-flashBlue {
          animation: flashBlue 0.5s ease-in-out infinite;
          animation-delay: 0.25s;
        }
      `}</style>
    </button>
  );
};

export { GlowButton };
