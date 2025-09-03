import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Settings, Menu, X } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, profile } = useAuth();
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
      label: 'Capture',
      onClick: () => navigate('/capture'),
      position: { left: '-60px', bottom: '100px' } // Left position
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: 'Details',
      onClick: () => navigate('/details-previous'),
      position: { left: '-30px', bottom: '120px' } // Left-center position
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: 'Books',
      onClick: () => navigate('/books'),
      position: { left: '30px', bottom: '120px' } // Right-center position
    },
    {
      icon: <Settings className="w-6 h-6" />,
      label: 'Export',
      onClick: () => navigate('/export'),
      position: { left: '60px', bottom: '100px' } // Right position
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue relative overflow-hidden">
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
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="mb-6">
              <img 
                src="/vicecity.png" 
                alt="Vice City Logo" 
                className="mx-auto h-32 w-auto sm:h-36 md:h-40 lg:h-44 drop-shadow-[0_4px_12px_rgba(255,20,147,0.4)] opacity-95"
                style={{ 
                  filter: 'drop-shadow(0 0 15px rgba(0,255,255,0.3)) drop-shadow(0 0 25px rgba(255,20,147,0.2))',
                  mixBlendMode: 'normal'
                }}
              />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold vice-city-font text-white">
              Welcome Back
            </h1>
            {profile?.full_name && (
              <p className="text-vice-cyan text-lg">
                {profile.full_name}
              </p>
            )}
            <p className="text-vice-cyan/80 text-sm">
              Ready to capture violations
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        {/* Menu Buttons - Semi-circle layout */}
        {menuItems.map((item, index) => (
          <Button
            key={index}
            onClick={item.onClick}
            className={`
              absolute w-14 h-14 rounded-full bg-vice-cyan/80 hover:bg-vice-cyan border-2 border-vice-pink/50 backdrop-blur-sm
              transition-all duration-300 transform
              ${isMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-75 translate-y-4'
              }
            `}
            style={{
              left: item.position.left,
              bottom: item.position.bottom,
              transform: `translateX(-50%) ${isMenuOpen ? 'translateY(0)' : 'translateY(16px)'}`,
              transitionDelay: `${index * 100}ms`
            }}
          >
            {item.icon}
          </Button>
        ))}

        {/* Hamburger Button */}
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-16 h-16 rounded-full bg-vice-pink/80 hover:bg-vice-pink border-2 border-vice-cyan/50 backdrop-blur-sm transition-all duration-300"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}