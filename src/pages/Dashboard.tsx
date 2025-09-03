import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Settings, Menu, X } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const menuItems = [
    {
      icon: <Camera className="w-6 h-6" />,
      onClick: () => navigate('/capture'),
    },
    {
      icon: <FileText className="w-6 h-6" />,
      onClick: () => navigate('/details-previous'),
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      onClick: () => navigate('/books'),
    },
    {
      icon: <Settings className="w-6 h-6" />,
      onClick: () => navigate('/export'),
    }
  ];

  // Semi-circle dock configuration
  const radius = 120;
  const arcAngles = [135, 105, 75, 45]; // Degrees for upward arc (90° = straight up)
  const startAngle = 135; // Start angle (135 degrees from vertical)
  const totalAngle = -90; // Total arc span (-90 degrees for upward arc)
  
  // Calculate positions for each button in the arc
  const getButtonPosition = (index: number) => {
    const angleStep = totalAngle / (menuItems.length - 1);
    const angle = startAngle + (index * angleStep);
    const radians = (angle * Math.PI) / 180;
    
    const x = Math.cos(radians) * radius;
    const y = Math.sin(radians) * radius;
    
    return { x, y };
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: 'url(/2.jpeg)'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-vice-purple/20 to-black/60 z-10" />

      {/* Navigation Dock */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        {/* Arc Menu Buttons */}
        {menuItems.map((item, index) => {
          const position = getButtonPosition(index);
          
          return (
            <Button
              key={index}
              onClick={() => {
                item.onClick();
                setIsMenuOpen(false);
              }}
              className={`
                absolute w-14 h-14 rounded-full bg-vice-cyan/90 hover:bg-vice-cyan border-2 border-vice-pink/50 backdrop-blur-sm
                transition-all duration-500 ease-out shadow-lg group hover:scale-105
                ${isMenuOpen 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-75'
                }
              `}
              style={{
                left: isMenuOpen ? `${position.x}px` : '0px',
                bottom: isMenuOpen ? `${position.y}px` : '0px',
                transform: 'translate(-50%, -50%)',
                transitionDelay: `${index * 100}ms`,
                transitionProperty: 'all, left, bottom'
              }}
            >
              <div className="group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
            </Button>
          );
        })}

        {/* Hamburger Button */}
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink border-2 border-vice-cyan/50 backdrop-blur-sm transition-all duration-300 shadow-xl group relative z-10"
        >
          <div className="group-hover:scale-110 transition-transform duration-200">
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}