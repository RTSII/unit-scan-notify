import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, BookOpen, Camera, FileText, Download } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [showGreeting, setShowGreeting] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      // Trigger greeting animation after component mounts
      const timer = setTimeout(() => {
        setShowGreeting(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-vice-cyan border-t-transparent mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/2.jpeg)' }}
      />
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header area for greeting */}
        <div className="flex-1 flex items-start justify-center pt-16">
          <div className="relative">
            {/* Animated Greeting */}
            <div 
              className={`
                text-5xl sm:text-6xl font-bold text-center
                vice-block-letters
                transition-all duration-2000 ease-out
                ${showGreeting 
                  ? 'transform translate-y-0 opacity-100' 
                  : 'transform translate-y-8 opacity-0 text-vice-blue/30'
                }
              `}
              style={{
                clipPath: showGreeting 
                  ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                  : 'polygon(0 0, 100% 0, 100% 60%, 0 60%)',
                transition: 'clip-path 2s ease-out, transform 2s ease-out, opacity 2s ease-out',
                textShadow: showGreeting 
                  ? '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.4)'
                  : '0 0 5px rgba(0, 255, 255, 0.3)'
              }}
            >
              Hello, {firstName}
            </div>
          </div>
        </div>

        {/* Comma as water line reference */}
        <div className="flex justify-center">
          <div className="text-8xl text-vice-cyan/60 font-bold select-none">
            ,
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 flex items-end justify-center pb-20">
          <div className="relative">
            {/* Semi-circle navigation buttons */}
            <div className="relative">
              {/* Books - far left, lower */}
              <Button
                className="absolute w-16 h-16 rounded-full bg-vice-blue/80 hover:bg-vice-blue border-2 border-vice-cyan/30 hover:border-vice-cyan transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-vice-blue/50"
                style={{ 
                  left: '-140px', 
                  bottom: '40px',
                  animationDelay: '0.1s'
                }}
              >
                <BookOpen className="h-6 w-6 text-white" />
              </Button>

              {/* Capture - left, higher */}
              <Button
                className="absolute w-16 h-16 rounded-full bg-vice-pink/80 hover:bg-vice-pink border-2 border-vice-cyan/30 hover:border-vice-cyan transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-vice-pink/50"
                style={{ 
                  left: '-80px', 
                  bottom: '80px',
                  animationDelay: '0.2s'
                }}
              >
                <Camera className="h-6 w-6 text-white" />
              </Button>

              {/* Details - right, higher */}
              <Button
                className="absolute w-16 h-16 rounded-full bg-vice-cyan/80 hover:bg-vice-cyan border-2 border-vice-cyan/30 hover:border-vice-cyan transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-vice-cyan/50"
                style={{ 
                  left: '20px', 
                  bottom: '80px',
                  animationDelay: '0.3s'
                }}
              >
                <FileText className="h-6 w-6 text-white" />
              </Button>

              {/* Export - far right, lower */}
              <Button
                className="absolute w-16 h-16 rounded-full bg-vice-purple/80 hover:bg-vice-purple border-2 border-vice-cyan/30 hover:border-vice-cyan transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-vice-purple/50"
                style={{ 
                  left: '80px', 
                  bottom: '40px',
                  animationDelay: '0.4s'
                }}
              >
                <Download className="h-6 w-6 text-white" />
              </Button>

              {/* Central hamburger menu */}
              <Button
                className="w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 border-2 border-vice-cyan/50 hover:border-vice-cyan transition-all duration-300 hover:scale-110 shadow-xl backdrop-blur-sm"
              >
                <Menu className="h-6 w-6 text-vice-cyan" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for Vice City font */}
      <style jsx>{`
        .vice-block-letters {
          font-family: 'Impact', 'Arial Black', sans-serif;
          font-weight: 900;
          letter-spacing: 0.1em;
          background: linear-gradient(45deg, #00ffff, #ff1493, #9400d3);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}