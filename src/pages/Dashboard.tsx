import { useState, useEffect } from "react";
import { Camera, FileText, BookOpen, Printer, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showButtons, setShowButtons] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  // Trigger greeting animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleHamburgerClick = () => {
    setShowButtons(!showButtons);
  };

  // Get user's first name from profile or email
  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/2.jpeg')`
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Section for Animated Greeting */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Static Comma positioned in center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-8xl font-bold text-white/80 vice-city-font drop-shadow-2xl">,</span>
          </div>

          {/* Animated Greeting */}
          <div className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ease-out ${
            showGreeting 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-32 opacity-0'
          }`}>
            <h1 className="text-5xl sm:text-6xl font-bold text-white drop-shadow-2xl vice-city-font vice-neon-glow text-center">
              Hello, {getFirstName()}
            </h1>
          </div>
        </div>

        {/* Main Navigation Area */}
        <div className="pb-20 px-8">
          <div className="flex justify-center items-end relative">
            {/* Translucent Hamburger Button */}
            <Button
              onClick={handleHamburgerClick}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
              size="lg"
            >
              <Menu className="w-6 h-6 text-white" />
            </Button>

            {/* Semi-Circle Navigation Buttons */}
            {showButtons && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
                {/* Books Button - Far Left */}
                <Button
                  onClick={() => navigate('/books')}
                  className="absolute w-16 h-16 rounded-full bg-vice-blue hover:bg-vice-blue/80 text-white shadow-2xl shadow-vice-blue/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '-140px',
                    bottom: '40px',
                    animationDelay: '0.1s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Books</span>
                  </div>
                </Button>

                {/* Capture Button - Left */}
                <Button
                  onClick={() => navigate('/capture')}
                  className="absolute w-16 h-16 rounded-full bg-vice-pink hover:bg-vice-pink/80 text-white shadow-2xl shadow-vice-pink/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '-80px',
                    bottom: '80px',
                    animationDelay: '0.2s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Capture</span>
                  </div>
                </Button>

                {/* Details Button - Right */}
                <Button
                  onClick={() => navigate('/details-previous')}
                  className="absolute w-16 h-16 rounded-full bg-vice-cyan hover:bg-vice-cyan/80 text-white shadow-2xl shadow-vice-cyan/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '20px',
                    bottom: '80px',
                    animationDelay: '0.3s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <FileText className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Details</span>
                  </div>
                </Button>

                {/* Export Button - Far Right */}
                <Button
                  onClick={() => navigate('/export')}
                  className="absolute w-16 h-16 rounded-full bg-vice-purple hover:bg-vice-purple/80 text-white shadow-2xl shadow-vice-purple/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '80px',
                    bottom: '40px',
                    animationDelay: '0.4s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Printer className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Export</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;