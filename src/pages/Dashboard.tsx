import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Download, Settings, User, LogOut } from 'lucide-react';

import { SiriOrb } from '../components/ui/siri-orb';

// Import the background image properly
import backgroundImage from '/2.png';

export default function Dashboard() {
  const { user, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard Debug Info:');
    console.log('- User:', user?.email);
    console.log('- Profile:', profile);
    console.log('- Profile Role:', profile?.role);
    console.log('- Loading:', loading);
  }, [user, profile, loading]);

  // Handle click outside for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  // Base menu items for all users
  const baseMenuItems = [
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

  // Add Admin icon for admin users only
  const menuItems = profile?.role === 'admin'
    ? [
      ...baseMenuItems,
      {
        icon: <Settings className="w-5 h-5 xs:w-6 xs:h-6" />,
        onClick: () => navigate('/admin'),
        label: 'Admin'
      }
    ]
    : baseMenuItems;

  // Debug: Show current menu count
  console.log('Menu items count:', menuItems.length, 'Is admin:', profile?.role === 'admin');

  // Responsive semi-circle arc configuration - 180 degrees around center orb
  const getButtonPosition = (index: number) => {
    // Responsive radius based on screen size
    const getRadius = () => {
      if (window.innerWidth <= 375) return 100; // iPhone SE
      if (window.innerWidth <= 390) return 110; // iPhone 13/14/15
      if (window.innerWidth <= 428) return 120; // iPhone Pro Max
      return 130; // Larger screens
    };

    const radius = getRadius();

    const totalItems = menuItems.length;
    const totalAngle = 180; // Total arc span in degrees (semi-circle)
    const angleStep = totalAngle / (totalItems > 1 ? totalItems - 1 : 1);
    const startAngle = 180; // Start arc from directly above orb (180° = 12 o'clock position)

    const angle = startAngle - (index * angleStep); // Sweep clockwise to form an upward arc above orb

    // Convert to radians
    const radians = (angle * Math.PI) / 180;

    // Calculate x, y position
    const x = Math.cos(radians) * radius;
    const y = -Math.sin(radians) * radius; // negative for upward positioning

    return { x, y };
  };

  return (
    <div
      className="dashboard-container bg-cover bg-center bg-gray-900 min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-vice-purple/20 to-black/60 z-10" />

      {/* User Avatar with Sign Out - Top Right Corner */}
      <div className="fixed top-4 right-4 z-50" ref={userMenuRef}>
        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="relative h-10 w-10 rounded-full bg-vice-cyan/20 backdrop-blur-sm border-2 border-vice-pink/30 hover:border-vice-pink/60 transition-all duration-300"
          >
            <User className="h-5 w-5 text-vice-cyan" />
          </Button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-black/90 backdrop-blur-sm border border-vice-cyan/30 rounded-lg shadow-xl z-50">
              <div className="px-3 py-2 border-b border-vice-cyan/20">
                <p className="text-sm font-medium text-vice-cyan">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-vice-pink/70">{user?.email}</p>
                {profile?.role && (
                  <p className="text-xs text-vice-purple capitalize mt-1">Role: {profile.role}</p>
                )}
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsUserMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-vice-pink hover:bg-vice-pink/10 transition-colors duration-200 flex items-center justify-center text-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Vertically Centered Navigation */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="relative">
          {/* Arc Menu Buttons - Books, Capture, Details, Export, Admin (if admin) */}
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
                  absolute touch-target-lg rounded-full backdrop-blur-sm
                  border-2 transition-all duration-500 ease-out shadow-lg group hover:scale-105
                  flex items-center justify-center no-select
                  w-12 h-12 xs:w-14 xs:h-14
                  ${item.label === 'Admin'
                    ? 'bg-vice-pink/90 hover:bg-vice-pink border-vice-cyan/50'
                    : 'bg-vice-cyan/90 hover:bg-vice-cyan border-vice-pink/50'
                  }
                  ${isMenuOpen
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-75 pointer-events-none'
                  }
                `}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: isMenuOpen
                    ? `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
                    : 'translate(-50%, -50%)',
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

          {/* Siri Orb Button - Vertically Centered */}
          <div className="relative touch-target-lg rounded-full bg-transparent backdrop-blur-sm
                          transition-all duration-300 shadow-xl group
                          flex items-center justify-center no-select">
            <SiriOrb
              size={64}
              animationDuration={2}
              colors={{
                bg: "linear-gradient(45deg, #8b2fa0, #ff1493)",
                c1: "rgba(255, 255, 255, 0.7)",
                c2: "rgba(255, 255, 255, 0.5)",
                c3: "rgba(255, 255, 255, 0.3)",
              }}
              className="drop-shadow-2xl"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
