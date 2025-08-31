import { Camera, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

        {/* Bottom Navigation Buttons */}
        <div className="pb-20 px-8">
          <div className="flex justify-center items-center space-x-12">
            {/* Capture Button */}
            <Button
              onClick={() => navigate('/capture')}
              className="w-20 h-20 rounded-full bg-vice-pink hover:bg-vice-pink/80 text-white shadow-2xl shadow-vice-pink/30 transition-all duration-300 transform hover:scale-110"
              size="lg"
            >
              <div className="flex flex-col items-center">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs font-semibold">Capture</span>
              </div>
            </Button>

            {/* Details Button */}
            <Button
              onClick={() => navigate('/details-previous')}
              className="w-20 h-20 rounded-full bg-vice-cyan hover:bg-vice-cyan/80 text-white shadow-2xl shadow-vice-cyan/30 transition-all duration-300 transform hover:scale-110"
              size="lg"
            >
              <div className="flex flex-col items-center">
                <FileText className="w-8 h-8 mb-1" />
                <span className="text-xs font-semibold">Details</span>
              </div>
            </Button>

            {/* Books Button */}
            <Button
              onClick={() => navigate('/books')}
              className="w-20 h-20 rounded-full bg-vice-blue hover:bg-vice-blue/80 text-white shadow-2xl shadow-vice-blue/30 transition-all duration-300 transform hover:scale-110"
              size="lg"
            >
              <div className="flex flex-col items-center">
                <BookOpen className="w-8 h-8 mb-1" />
                <span className="text-xs font-semibold">Books</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;