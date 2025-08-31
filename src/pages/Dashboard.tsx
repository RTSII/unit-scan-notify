import { useState } from "react";
import { Camera, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showIcons, setShowIcons] = useState(false);

  const handleMainButtonClick = () => {
    setShowIcons(!showIcons);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ocean Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/lovable-uploads/b6712007-fdbb-47bc-9609-07aeba8618e2.png')`
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
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
            {/* Transparent Main Button */}
            <Button
              onClick={handleMainButtonClick}
              className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
              size="lg"
            >
              <div className="w-6 h-6 bg-white/60 rounded-full"></div>
            </Button>

            {/* Semi-Circle Navigation Icons */}
            {showIcons && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
                {/* Capture Button - Left */}
                <Button
                  onClick={() => navigate('/capture')}
                  className="absolute w-20 h-20 rounded-full bg-vice-pink hover:bg-vice-pink/80 text-white shadow-2xl shadow-vice-pink/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '-120px',
                    bottom: '20px',
                    animationDelay: '0.1s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs font-semibold">Capture</span>
                  </div>
                </Button>

                {/* Details Button - Center */}
                <Button
                  onClick={() => navigate('/details-previous')}
                  className="absolute w-20 h-20 rounded-full bg-vice-cyan hover:bg-vice-cyan/80 text-white shadow-2xl shadow-vice-cyan/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '-40px',
                    bottom: '60px',
                    animationDelay: '0.2s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 mb-1" />
                    <span className="text-xs font-semibold">Details</span>
                  </div>
                </Button>

                {/* Books Button - Right */}
                <Button
                  onClick={() => navigate('/books')}
                  className="absolute w-20 h-20 rounded-full bg-vice-blue hover:bg-vice-blue/80 text-white shadow-2xl shadow-vice-blue/30 transition-all duration-500 transform hover:scale-110 animate-in slide-in-from-bottom-4"
                  style={{
                    left: '40px',
                    bottom: '20px',
                    animationDelay: '0.3s'
                  }}
                >
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-8 h-8 mb-1" />
                    <span className="text-xs font-semibold">Books</span>
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