import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Menu, BookOpen, Camera, FileText, Download } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Trigger greeting animation on mount
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const getFirstName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/2.jpeg)' }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with animated greeting */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Comma positioned in center */}
          <div className="absolute text-white/20 text-9xl font-bold select-none pointer-events-none">
            ,
          </div>
          
          {/* Animated Greeting */}
          <div className="relative">
            <h1 
              className={`
                text-5xl sm:text-6xl font-bold text-center
                bg-gradient-to-r from-vice-pink via-vice-cyan to-vice-purple bg-clip-text text-transparent
                drop-shadow-[0_0_20px_rgba(255,20,147,0.8)]
                transition-all duration-2000 ease-out
                ${showGreeting 
                  ? 'transform translate-y-0 opacity-100' 
                  : 'transform translate-y-32 opacity-0'
                }
              `}
              style={{
                fontFamily: 'Impact, Arial Black, sans-serif',
                letterSpacing: '0.1em',
                textShadow: `
                  0 0 10px rgba(0, 255, 255, 0.8),
                  0 0 20px rgba(255, 20, 147, 0.6),
                  0 0 30px rgba(138, 43, 226, 0.4),
                  2px 2px 0px rgba(0, 0, 0, 0.8)
                `,
                filter: 'drop-shadow(0 0 15px rgba(255, 20, 147, 0.5))'
              }}
            >
              Hello, {getFirstName()}
            </h1>
            
            {/* Water emergence mask */}
            <div 
              className={`
                absolute inset-0 bg-gradient-to-t from-cyan-400/80 via-blue-500/60 to-transparent
                transition-all duration-2000 ease-out
                ${showGreeting 
                  ? 'transform translate-y-full opacity-0' 
                  : 'transform translate-y-0 opacity-100'
                }
              `}
              style={{
                clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0% 100%)'
              }}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="relative pb-8">
          {/* Navigation Buttons */}
          <div className={`
            absolute bottom-20 left-1/2 transform -translate-x-1/2
            transition-all duration-500 ease-out
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
          `}>
            {/* Books - Far left, lower */}
            <Button
              onClick={() => navigateTo('/books')}
              className={`
                absolute w-16 h-16 rounded-full
                bg-blue-500/80 hover:bg-blue-400/90 border-2 border-blue-300/50
                backdrop-blur-sm transition-all duration-300 hover:scale-110
                shadow-lg shadow-blue-500/30
                ${isMenuOpen ? 'animate-bounce-in' : ''}
              `}
              style={{ 
                left: '-140px', 
                bottom: '40px',
                animationDelay: '0.1s'
              }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </Button>

            {/* Capture - Left, higher */}
            <Button
              onClick={() => navigateTo('/capture')}
              className={`
                absolute w-16 h-16 rounded-full
                bg-pink-500/80 hover:bg-pink-400/90 border-2 border-pink-300/50
                backdrop-blur-sm transition-all duration-300 hover:scale-110
                shadow-lg shadow-pink-500/30
                ${isMenuOpen ? 'animate-bounce-in' : ''}
              `}
              style={{ 
                left: '-80px', 
                bottom: '80px',
                animationDelay: '0.2s'
              }}
            >
              <Camera className="h-6 w-6 text-white" />
            </Button>

            {/* Details - Right, higher */}
            <Button
              onClick={() => navigateTo('/details')}
              className={`
                absolute w-16 h-16 rounded-full
                bg-cyan-500/80 hover:bg-cyan-400/90 border-2 border-cyan-300/50
                backdrop-blur-sm transition-all duration-300 hover:scale-110
                shadow-lg shadow-cyan-500/30
                ${isMenuOpen ? 'animate-bounce-in' : ''}
              `}
              style={{ 
                left: '20px', 
                bottom: '80px',
                animationDelay: '0.3s'
              }}
            >
              <FileText className="h-6 w-6 text-white" />
            </Button>

            {/* Export - Far right, lower */}
            <Button
              onClick={() => navigateTo('/export')}
              className={`
                absolute w-16 h-16 rounded-full
                bg-purple-500/80 hover:bg-purple-400/90 border-2 border-purple-300/50
                backdrop-blur-sm transition-all duration-300 hover:scale-110
                shadow-lg shadow-purple-500/30
                ${isMenuOpen ? 'animate-bounce-in' : ''}
              `}
              style={{ 
                left: '80px', 
                bottom: '40px',
                animationDelay: '0.4s'
              }}
            >
              <Download className="h-6 w-6 text-white" />
            </Button>
          </div>

          {/* Hamburger Button */}
          <div className="flex justify-center">
            <Button
              onClick={toggleMenu}
              className={`
                w-16 h-16 rounded-full
                bg-black/60 hover:bg-black/80 border-2 border-white/30
                backdrop-blur-sm transition-all duration-300 hover:scale-105
                shadow-lg shadow-black/50
                ${isMenuOpen ? 'rotate-90' : 'rotate-0'}
              `}
            >
              <Menu className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes water-emerge {
          0% {
            transform: translateY(100px);
            clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0% 100%);
          }
          100% {
            transform: translateY(0);
            clip-path: polygon(0 0%, 100% 0%, 100% 100%, 0% 100%);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            transform: scale(1.1) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-water-emerge {
          animation: water-emerge 2s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}