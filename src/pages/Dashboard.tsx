import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Camera, FileText, Download, Menu } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
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

  // Start greeting animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setGreetingVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-cover bg-center bg-no-repeat overflow-hidden" 
         style={{ backgroundImage: 'url(/2.jpeg)' }}>
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-black/20 z-0" />
      
      {/* Animated waves */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-30 z-10">
        <div className="wave-bg h-16 bg-gradient-to-r from-vice-cyan to-vice-pink animate-wave-1"></div>
        <div className="wave-bg h-12 bg-gradient-to-r from-vice-pink to-vice-purple animate-wave-2 -mt-6"></div>
        <div className="wave-bg h-8 bg-gradient-to-r from-vice-blue to-vice-cyan animate-wave-3 -mt-4"></div>
      </div>

      {/* Lens flares */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-vice-cyan rounded-full opacity-20 blur-xl animate-lens-flare-1 z-10"></div>
      <div className="absolute top-20 right-16 w-16 h-16 bg-vice-pink rounded-full opacity-30 blur-lg animate-lens-flare-2 z-10"></div>
      <div className="absolute bottom-20 left-16 w-24 h-24 bg-vice-purple rounded-full opacity-15 blur-2xl animate-lens-flare-3 z-10"></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 bg-vice-orange rounded-full opacity-25 blur-md animate-lens-flare-4 z-10"></div>

      {/* Main Content */}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Greeting with Water Emergence Effect */}
        <div className="text-center mb-8">
          <div className="relative">
            <h1 
              className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold transition-all duration-2000 ease-out ${
                greetingVisible 
                  ? 'vice-block-letters translate-y-0 opacity-100' 
                  : 'text-vice-blue/30 translate-y-8 opacity-70'
              }`}
              style={{
                clipPath: greetingVisible 
                  ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' 
                  : 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)'
              }}
            >
              Welcome,
            </h1>
          </div>
        </div>
      </div>

      {/* Hamburger Menu - Positioned closer to bottom */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 pb-8 z-40">
        <div className="relative">
          {/* Navigation Buttons - Appear vertically above hamburger when expanded */}
          <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-out ${
            isMenuExpanded 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-8 pointer-events-none'
          }`}>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/books')}
                className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-vice-cyan/30 hover:bg-vice-cyan/20 transition-all duration-300 transform hover:scale-110"
                style={{ animationDelay: '0.1s' }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </Button>
              
              <Button
                onClick={() => navigate('/capture')}
                className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-vice-cyan/30 hover:bg-vice-pink/20 transition-all duration-300 transform hover:scale-110"
                style={{ animationDelay: '0.2s' }}
              >
                <Camera className="w-6 h-6 text-white" />
              </Button>
              
              <Button
                onClick={() => navigate('/details-previous')}
                className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-vice-cyan/30 hover:bg-vice-purple/20 transition-all duration-300 transform hover:scale-110"
                style={{ animationDelay: '0.3s' }}
              >
                <FileText className="w-6 h-6 text-white" />
              </Button>
              
              <Button
                onClick={() => navigate('/export')}
                className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-vice-cyan/30 hover:bg-vice-orange/20 transition-all duration-300 transform hover:scale-110"
                style={{ animationDelay: '0.4s' }}
              >
                <Download className="w-6 h-6 text-white" />
              </Button>
            </div>
          </div>

          {/* Hamburger Button */}
          <Button
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            className={`w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm border-2 border-vice-cyan/50 hover:bg-vice-cyan/20 transition-all duration-300 transform hover:scale-105 ${
              isMenuExpanded ? 'rotate-45' : 'rotate-0'
            }`}
          >
            <Menu className="w-8 h-8 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}