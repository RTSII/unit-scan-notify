import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, BookOpen, Camera, FileText, Download } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGreetingVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: 'url(/2.jpeg)' }}
      />
      
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

      {/* Content */}
      <div className="relative flex flex-col justify-center items-center min-h-screen py-6 px-4 z-30">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 
            className={`vice-block-letters text-6xl md:text-7xl lg:text-8xl font-black transition-all duration-2000 ease-out ${
              greetingVisible 
                ? 'opacity-100 translate-y-0 clip-path-none' 
                : 'opacity-30 translate-y-8 clip-path-water'
            }`}
            style={{
              clipPath: greetingVisible ? 'none' : 'polygon(0 60%, 100% 60%, 100% 100%, 0% 100%)'
            }}
          >
            HELLO,
          </h1>
        </div>
      </div>

      {/* Hamburger Menu */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 pb-8 z-40">
        <div className="relative">
          {/* Navigation Buttons */}
          <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
            isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
            <div className="flex flex-col space-y-3">
              <Button
                onClick={() => navigate('/books')}
                className="w-14 h-14 rounded-full bg-vice-cyan/20 border-2 border-vice-cyan/40 backdrop-blur-sm hover:bg-vice-cyan/30 transition-all duration-200 delay-75"
              >
                <BookOpen className="h-6 w-6 text-vice-cyan" />
              </Button>
              <Button
                onClick={() => navigate('/capture')}
                className="w-14 h-14 rounded-full bg-vice-pink/20 border-2 border-vice-pink/40 backdrop-blur-sm hover:bg-vice-pink/30 transition-all duration-200 delay-100"
              >
                <Camera className="h-6 w-6 text-vice-pink" />
              </Button>
              <Button
                onClick={() => navigate('/details-previous')}
                className="w-14 h-14 rounded-full bg-vice-purple/20 border-2 border-vice-purple/40 backdrop-blur-sm hover:bg-vice-purple/30 transition-all duration-200 delay-125"
              >
                <FileText className="h-6 w-6 text-vice-purple" />
              </Button>
              <Button
                onClick={() => navigate('/export')}
                className="w-14 h-14 rounded-full bg-vice-orange/20 border-2 border-vice-orange/40 backdrop-blur-sm hover:bg-vice-orange/30 transition-all duration-200 delay-150"
              >
                <Download className="h-6 w-6 text-vice-orange" />
              </Button>
            </div>
          </div>

          {/* Hamburger Button */}
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-16 h-16 rounded-full bg-black/40 border-2 border-vice-cyan/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 ${
              isMenuOpen ? 'rotate-45' : 'rotate-0'
            }`}
          >
            <Menu className="h-8 w-8 text-vice-cyan" />
          </Button>
        </div>
      </div>
    </div>
  );
}