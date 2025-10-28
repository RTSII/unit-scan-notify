import { motion } from "framer-motion";

export default function DeleteSphereSpinner() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Outer rotating ring (clockwise) */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-vice-cyan border-r-vice-cyan"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Middle rotating ring (clockwise, faster) */}
      <motion.div
        className="absolute inset-2 rounded-full border-4 border-transparent border-b-vice-pink border-l-vice-pink"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Inner pulsing sphere */}
      <motion.div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-vice-cyan/40 via-vice-purple/40 to-vice-pink/40 shadow-[0_0_30px_rgba(0,255,255,0.5)]"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 30px rgba(0,255,255,0.5)",
            "0 0 50px rgba(255,105,180,0.7)",
            "0 0 30px rgba(0,255,255,0.5)"
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Rotating sphere texture (clockwise) */}
      <motion.div
        className="absolute inset-10 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Center glow */}
      <div className="absolute inset-12 rounded-full bg-white/20 blur-sm" />
    </div>
  );
}
