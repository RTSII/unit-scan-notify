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
      position: { left: '-120px', bottom: '140px' } // Far left position
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: 'Details',
      onClick: () => navigate('/details-previous'),
      position: { left: '-60px', bottom: '180px' } // Left-center position
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: 'Books',
      onClick: () => navigate('/books'),
      position: { left: '60px', bottom: '180px' } // Right-center position
    },
    {
      icon: <Settings className="w-6 h-6" />,
      label: 'Export',
      onClick: () => navigate('/export'),
      position: { left: '120px', bottom: '140px' } // Far right position
    }
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: 'url(/2.jpeg)'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Content */}
      <div className="relative flex flex-col justify-center items-center min-h-screen py-6 px-4 z-30">
        <div className="w-full max-w-sm space-y-6">
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
              absolute w-16 h-16 rounded-full bg-vice-cyan/80 hover:bg-vice-cyan border-2 border-vice-pink/50 backdrop-blur-sm
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