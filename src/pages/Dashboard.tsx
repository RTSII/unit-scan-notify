import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Download, Menu, X } from 'lucide-react';

// Import the background image
const backgroundImage = '/2.jpeg';

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
      <div className="min-h-screen-mobile bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center p-safe">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // CORRECTED ORDER: Books (far left), Capture, Details, Export (far right)
  const menuItems = [
    {
      icon: <BookOpen className="w-5 h-5 xs:w-6 xs:h-6" />,
      onClick: () => navigate('/books'),
      label: 'Books'
    },
    {
      icon: <Camera className="w-5 h-5 xs:w-6 xs:h-6" />,
      onClick: () => navigate('/capture'),
      label: 'Capture'
    },
    {
      icon: <FileText className="w-5 h-5 xs:w-6 xs:h-6" />,
      onClick: () => navigate('/details-previous'),
      label: 'Details'
    },
    {
      icon: <Download className="w-5 h-5 xs:w-6 xs:h-6" />,
      onClick: () => navigate('/export'),
      label: 'Export'
    }
  ];

  // Responsive semi-circle arc configuration - 180 degrees above hamburger
  const getButtonPosition = (index: number) => {
    // Responsive radius based on screen size
    const getRadius = () => {
      if (window.innerWidth <= 375) return 100; // iPhone SE
      if (window.innerWidth <= 390) return 110; // iPhone 13/14/15
      if (window.innerWidth <= 428) return 120; // iPhone Pro Max
      return 130; // Larger screens
    };

    const radius = getRadius();

    // REVERSED angles to fix mirroring: 150°, 110°, 70°, 30° from horizontal
    // This will place Books on far left and Export on far right
    const angles = [150, 110, 70, 30]; // degrees from horizontal (0° = right, 90° = up)
    const angle = angles[index];

    // Convert to radians
    const radians = (angle * Math.PI) / 180;

    // Calculate x, y position (negative y because we want buttons above)
    const x = Math.cos(radians) * radius;
    const y = -Math.sin(radians) * radius; // negative for upward positioning

    return { x, y };
  };

  return (
    <div
      className="dashboard-container bg-cover bg-center bg-gray-900"
      style={{
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-vice-purple/20 to-black/60 z-10" />

      {/* Navigation Dock */}
      <div className="fixed bottom-6 xs:bottom-8 left-1/2 transform -translate-x-1/2 z-50 pb-safe">
        <div className="relative">
          {/* Arc Menu Buttons - Books, Capture, Details, Export */}
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
                  absolute touch-target-lg rounded-full bg-vice-cyan/90 hover:bg-vice-cyan 
                  border-2 border-vice-pink/50 backdrop-blur-sm
                  transition-all duration-500 ease-out shadow-lg group hover:scale-105
                  flex items-center justify-center no-select
                  w-12 h-12 xs:w-14 xs:h-14
                  ${isMenuOpen
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-75 pointer-events-none'
                  }
                `}
                style={{
                  left: '50%',
                  bottom: '50%',
                  transform: isMenuOpen
                    ? `translate(calc(-50% + ${position.x}px), calc(50% + ${position.y}px))`
                    : 'translate(-50%, 50%)',
                  transitionDelay: isMenuOpen ? `${index * 80}ms` : `${(menuItems.length - 1 - index) * 80}ms`,
                  zIndex: 40
                }}
              >
                <div className="group-hover:scale-110 transition-transform duration-200 text-white">
                  {item.icon}
                </div>
              </Button>
            );
          })}

          {/* Hamburger Button */}
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="touch-target-lg rounded-full bg-gradient-to-r from-vice-pink to-vice-purple 
                     hover:from-vice-purple hover:to-vice-pink border-2 border-vice-cyan/50 
                     backdrop-blur-sm transition-all duration-300 shadow-xl group relative z-50
                     flex items-center justify-center no-select
                     w-14 h-14 xs:w-16 xs:h-16"
          >
            <div className="group-hover:scale-110 transition-transform duration-200">
              {isMenuOpen ? (
                <X className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
              ) : (
                <Menu className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Optional: Add a subtle label for the current page */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 pt-safe">
        <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-vice-cyan/30">
          <p className="text-white text-sm font-medium">Dashboard</p>
        </div>
      </div>
    </div>
  );
}