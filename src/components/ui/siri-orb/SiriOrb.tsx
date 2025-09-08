"use client"

import React, { useState, useEffect, useRef } from "react"

interface SiriOrbProps {
  size?: string | number
  className?: string
  colors?: {
    bg?: string
    c1?: string
    c2?: string
    c3?: string
  }
  animationDuration?: number
  onClick?: () => void
}

const SiriOrb: React.FC<SiriOrbProps> = ({
  size = 64,
  className = "",
  colors = {
    bg: "linear-gradient(45deg, #8b2fa0, #ff1493)",
    c1: "rgba(255, 255, 255, 0.7)",
    c2: "rgba(255, 255, 255, 0.5)",
    c3: "rgba(255, 255, 255, 0.3)",
  },
  animationDuration = 2,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  
  // Convert size to pixels if it's a number
  const sizePx = typeof size === 'number' ? `${size}px` : size
  
  // Handle click to toggle active state
  const handleClick = () => {
    setIsActive(!isActive)
    if (onClick) onClick()
  }

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-center justify-center cursor-pointer ${className}`}
      style={{ width: sizePx, height: sizePx }}
      onClick={handleClick}
    >
      {/* Main orb container */}
      <div 
        className="rounded-full flex items-center justify-center relative overflow-hidden drop-shadow-2xl"
        style={{ 
          width: sizePx, 
          height: sizePx,
          background: colors.bg || "linear-gradient(45deg, #8b2fa0, #ff1493)",
          boxShadow: "0 0 20px rgba(139, 47, 160, 0.7), 0 0 40px rgba(255, 20, 147, 0.5)",
        }}
      >
        {/* Animated concentric circles with subtle idle animation */}
        <div 
          className="absolute rounded-full border-2"
          style={{
            width: '100%',
            height: '100%',
            borderColor: colors.c1 || "rgba(255, 255, 255, 0.7)",
            animation: `siri-pulse-1 ${animationDuration}s infinite ease-in-out`,
            animationPlayState: 'running',
          }}
        />
        <div 
          className="absolute rounded-full border-2"
          style={{
            width: '90%',
            height: '90%',
            borderColor: colors.c2 || "rgba(255, 255, 255, 0.5)",
            animation: `siri-pulse-2 ${animationDuration + 0.5}s infinite ease-in-out`,
            animationPlayState: 'running',
          }}
        />
        <div 
          className="absolute rounded-full border-2"
          style={{
            width: '80%',
            height: '80%',
            borderColor: colors.c3 || "rgba(255, 255, 255, 0.3)",
            animation: `siri-pulse-3 ${animationDuration + 1}s infinite ease-in-out`,
            animationPlayState: 'running',
          }}
        />
        
        {/* Center dot with subtle idle animation */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '15%',
            height: '15%',
            background: colors.c1 || "rgba(255, 255, 255, 0.7)",
            animation: `siri-dot-pulse ${animationDuration/2}s infinite ease-in-out`,
            animationPlayState: 'running',
          }}
        />
      </div>
      
      {/* Outer glow effect when active */}
      {isActive && (
        <div
          className="absolute rounded-full"
          style={{
            width: `calc(${sizePx} * 1.4)`,
            height: `calc(${sizePx} * 1.4)`,
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
            zIndex: -1,
            animation: `siri-glow ${animationDuration/1.5}s infinite ease-in-out`,
          }}
        />
      )}
      
      <style>{`
        @keyframes siri-pulse-1 {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.4; }
        }
        
        @keyframes siri-pulse-2 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.07); opacity: 0.3; }
        }
        
        @keyframes siri-pulse-3 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.09); opacity: 0.2; }
        }
        
        @keyframes siri-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        
        @keyframes siri-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

export default SiriOrb