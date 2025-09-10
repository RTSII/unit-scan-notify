import React from "react";

interface BackgroundGradientAnimationProps {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  interactive?: boolean;
}

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(139, 47, 160)", // vice-purple
  gradientBackgroundEnd = "rgb(65, 105, 225)", // vice-blue
  firstColor = "139, 47, 160", // vice-purple
  secondColor = "255, 20, 147", // vice-pink
  thirdColor = "0, 255, 255", // vice-cyan
  fourthColor = "255, 99, 71", // vice-orange
  fifthColor = "65, 105, 225", // vice-blue
  pointerColor = "139, 47, 160", // vice-purple
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  containerClassName,
  interactive = true,
}: BackgroundGradientAnimationProps) => {
  return (
    <div
      className={`h-screen w-screen relative overflow-hidden ${containerClassName || ""}`}
      style={{
        background: `linear-gradient(40deg, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`,
      }}
    >
      {/* Animated gradient circles */}
      <div className={`absolute top-0 left-0 w-full h-full overflow-hidden ${className || ""}`}>
        {/* First animated circle - circular orbit with pulse effect */}
        <div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px]"
          style={{
            background: `radial-gradient(circle, rgba(${firstColor}, 0.8) 0%, transparent 70%)`,
            filter: "blur(60px)",
            width: size,
            height: size,
            animation: "moveInCircle2 20s linear infinite, pulse 4s ease-in-out infinite",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        />

        {/* Second animated circle - horizontal movement */}
        <div
          className="absolute top-1/4 left-0 w-[600px] h-[600px]"
          style={{
            background: `radial-gradient(circle, rgba(${secondColor}, 0.8) 0%, transparent 70%)`,
            filter: "blur(60px)",
            width: size,
            height: size,
            animation: "moveHorizontal 15s ease-in-out infinite",
            zIndex: 2,
          }}
        />

        {/* Third animated circle - vertical movement with float effect */}
        <div
          className="absolute bottom-1/4 right-0 w-[600px] h-[600px]"
          style={{
            background: `radial-gradient(circle, rgba(${thirdColor}, 0.8) 0%, transparent 70%)`,
            filter: "blur(60px)",
            width: size,
            height: size,
            animation: "moveVertical 12s ease-in-out infinite, float 8s ease-in-out infinite",
            zIndex: 3,
          }}
        />

        {/* Fourth animated circle - diagonal movement */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px]"
          style={{
            background: `radial-gradient(circle, rgba(${fourthColor}, 0.8) 0%, transparent 70%)`,
            filter: "blur(60px)",
            width: size,
            height: size,
            animation: "moveDiagonal 25s ease-in-out infinite",
            zIndex: 4,
          }}
        />

        {/* Fifth animated circle - reverse horizontal */}
        <div
          className="absolute bottom-0 left-1/3 w-[600px] h-[600px]"
          style={{
            background: `radial-gradient(circle, rgba(${fifthColor}, 0.8) 0%, transparent 70%)`,
            filter: "blur(60px)",
            width: size,
            height: size,
            animation: "moveHorizontal 18s ease-in-out infinite reverse",
            zIndex: 5,
          }}
        />
      </div>

      {/* Interactive pointer effect */}
      {interactive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(${pointerColor}, 0.4) 0%, transparent 50%)`,
            backgroundBlendMode: blendingValue,
            zIndex: 10,
          }}
        />
      )}

      <div className="absolute inset-0 z-20">
        {children}
      </div>
    </div>
  );
};