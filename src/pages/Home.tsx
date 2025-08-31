import { useState } from "react";
import { Camera, FileText, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useIsMobile();

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  const menuItems = [
    {
      icon: Camera,
      label: "Capture",
      onClick: () => navigate('/dashboard?tab=capture'),
      position: { mobile: { x: -60, y: 40 }, desktop: { x: -100, y: 50 } },
      color: "bg-vice-pink hover:bg-vice-pink/80"
    },
    {
      icon: FileText,
      label: "Details",
      onClick: () => navigate('/dashboard?tab=template&blank=true'),
      position: { mobile: { x: 0, y: 80 }, desktop: { x: 0, y: 100 } },
      color: "bg-vice-cyan hover:bg-vice-cyan/80"
    },
    {
      icon: Database,
      label: "Directory",
      onClick: () => navigate('/books'),
      position: { mobile: { x: 60, y: 40 }, desktop: { x: 100, y: 50 } },
      color: "bg-vice-blue hover:bg-vice-blue/80"
    }
  ];

  return (
    <div 
      className="min-h-screen relative flex flex-col"
      style={{
        backgroundImage: `url('/lovable-uploads/0bc4a1f2-12e5-46ab-8d22-0ab400318f2a.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Background overlay for better contrast */}
      
      {/* Header with Sign Out */}
      <div className="relative z-10 flex justify-end p-4">
        <Button 
          onClick={signOut}
          variant="outline" 
          size="sm" 
          className="bg-black/50 border-white/30 text-white hover:bg-black/70 backdrop-blur-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Hero Section with Animated Greeting */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-4 sm:pt-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-8 sm:mb-16"
        >
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white drop-shadow-2xl vice-block-letters px-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Hello{" "}
            <motion.span 
              className="text-vice-pink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {userName}
            </motion.span>
          </motion.h1>
        </motion.div>

        {/* Interactive Bird Button Area - Centered on the gate's bird */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Bird Button - positioned to overlay directly on the sandpiper */}
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            className={`relative z-20 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full border-2 border-white/60 flex items-center justify-center hover:border-white/80 transition-all duration-300 touch-manipulation`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              // Adjust position to align with the bird in the gate - mobile first
              marginTop: isMobile ? '5vh' : '8vh'
            }}
          >
            <div className="w-6 h-6 text-white drop-shadow-lg">
              {/* Bird icon representation */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2c1.1 0 2 .9 2 2 0 .38-.1.73-.29 1.03L17 7.5V9l-1.5 1.5L17 12v1.5l-3.29 2.47c.19.3.29.65.29 1.03 0 1.1-.9 2-2 2s-2-.9-2-2c0-.38.1-.73.29-1.03L7 12V10.5l1.5-1.5L7 7.5V6l3.29-2.47C10.1 3.73 10 3.38 10 3c0-1.1.9-2 2-2z"/>
              </svg>
            </div>
          </motion.button>

          {/* Semi-Circle Menu */}
          <AnimatePresence>
            {showMenu && (
              <div className="absolute" style={{ marginTop: isMobile ? '5vh' : '8vh' }}>
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      initial={{ 
                        opacity: 0, 
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: isMobile ? item.position.mobile.x : item.position.desktop.x,
                        y: isMobile ? item.position.mobile.y : item.position.desktop.y
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200
                      }}
                      onClick={() => {
                        item.onClick();
                        setShowMenu(false);
                      }}
                      className={`absolute ${isMobile ? 'w-18 h-18' : 'w-16 h-16'} rounded-full ${item.color} backdrop-blur-md border border-white/30 flex flex-col items-center justify-center text-white shadow-xl transition-all duration-200 touch-manipulation`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Home;