import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, BookOpen, Camera, FileText, Download } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Start greeting animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-vice-pink border-t-transparent mx-auto mb-4" />
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
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* Comma positioned in center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 text-9xl font-bold pointer-events-none">
          ,
        </div>

        {/* Animated Greeting */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 
            className={`
              text-5xl sm:text-6xl font-bold text-center transition-all duration-2000 ease-out
              ${showGreeting 
                ? 'translate-y-0 opacity-100 text-transparent bg-clip-text bg-gradient-to-r from-vice-pink via-vice-cyan to-vice-purple' 
                : 'translate-y-16 opacity-30 text-vice-pink/30'
              }
            `}
            style={{
              fontFamily: 'Impact, Arial Black, sans-serif',
              textShadow: showGreeting 
                ? '0 0 20px rgba(255, 20, 147, 0.8), 0 0 40px rgba(0, 255, 255, 0.6), 0 0 60px rgba(138, 43, 226, 0.4)'
                : 'none',
              letterSpacing: '0.1em',
              clipPath: showGreeting 
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                : 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)'
            }}
          >
            Hello, {firstName}
          </h1>
        </div>

        {/* Navigation Menu */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          {/* Navigation Buttons - Semi-circle layout */}
          <div className={`relative transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Books Button */}
            <Button
              onClick={() => handleNavigation('/books')}
              className={`
                absolute w-16 h-16 rounded-full bg-blue-500/80 hover:bg-blue-500 
                border-2 border-blue-300/50 backdrop-blur-sm
                transition-all duration-300 hover:scale-110
                ${isMenuOpen ? 'translate-x-[-140px] translate-y-[-40px]' : 'translate-x-0 translate-y-0'}
              `}
              style={{ 
                transitionDelay: isMenuOpen ? '100ms' : '0ms',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </Button>

            {/* Capture Button */}
            <Button
              onClick={() => handleNavigation('/capture')}
              className={`
                absolute w-16 h-16 rounded-full bg-pink-500/80 hover:bg-pink-500 
                border-2 border-pink-300/50 backdrop-blur-sm
                transition-all duration-300 hover:scale-110
                ${isMenuOpen ? 'translate-x-[-80px] translate-y-[-80px]' : 'translate-x-0 translate-y-0'}
              `}
              style={{ 
                transitionDelay: isMenuOpen ? '200ms' : '0ms',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Camera className="h-6 w-6 text-white" />
            </Button>

            {/* Details Button */}
            <Button
              onClick={() => handleNavigation('/details')}
              className={`
                absolute w-16 h-16 rounded-full bg-cyan-500/80 hover:bg-cyan-500 
                border-2 border-cyan-300/50 backdrop-blur-sm
                transition-all duration-300 hover:scale-110
                ${isMenuOpen ? 'translate-x-[20px] translate-y-[-80px]' : 'translate-x-0 translate-y-0'}
              `}
              style={{ 
                transitionDelay: isMenuOpen ? '300ms' : '0ms',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <FileText className="h-6 w-6 text-white" />
            </Button>

            {/* Export Button */}
            <Button
              onClick={() => handleNavigation('/export')}
              className={`
                absolute w-16 h-16 rounded-full bg-purple-500/80 hover:bg-purple-500 
                border-2 border-purple-300/50 backdrop-blur-sm
                transition-all duration-300 hover:scale-110
                ${isMenuOpen ? 'translate-x-[80px] translate-y-[-40px]' : 'translate-x-0 translate-y-0'}
              `}
              style={{ 
                transitionDelay: isMenuOpen ? '400ms' : '0ms',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Download className="h-6 w-6 text-white" />
            </Button>
          </div>

          {/* Hamburger Button */}
          <Button
            onClick={toggleMenu}
            className="w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 border-2 border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            <Menu className={`h-6 w-6 text-white transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}