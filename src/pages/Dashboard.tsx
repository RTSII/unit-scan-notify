import { useState } from "react";
import { Camera, FileText, BookOpen, Printer, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showButtons, setShowButtons] = useState(false);

  const handleHamburgerClick = () => {
    setShowButtons(!showButtons);
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
        {/* Header with Hello, rob */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white drop-shadow-2xl mb-8">
              Hello, rob
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