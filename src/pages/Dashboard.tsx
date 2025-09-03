import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Settings, Menu, X, User, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      xOffset: -144
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: 'Details',
      onClick: () => navigate('/details-previous'),
      xOffset: -48
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: 'Books',
      onClick: () => navigate('/books'),
      xOffset: 48
    },
    {
      icon: <Settings className="w-6 h-6" />,
      label: 'Export',
      onClick: () => navigate('/export'),
      xOffset: 144
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: 'url(/2.jpeg)'
      }}
    >
      {/* Enhanced overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-vice-purple/20 to-black/60 z-10" />
      
      {/* Animated background effects */}
      <div className="absolute inset-0 z-20">
        {/* Animated waves */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-20">
          <div className="wave-bg h-16 bg-gradient-to-r from-vice-cyan to-vice-pink animate-wave-1"></div>
          <div className="wave-bg h-12 bg-gradient-to-r from-vice-pink to-vice-purple animate-wave-2 -mt-6"></div>
          <div className="wave-bg h-8 bg-gradient-to-r from-vice-blue to-vice-cyan animate-wave-3 -mt-4"></div>
        </div>

        {/* Lens flares */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-vice-cyan rounded-full opacity-15 blur-xl animate-lens-flare-1"></div>
        <div className="absolute top-20 right-16 w-16 h-16 bg-vice-pink rounded-full opacity-20 blur-lg animate-lens-flare-2"></div>
        <div className="absolute bottom-20 left-16 w-24 h-24 bg-vice-purple rounded-full opacity-10 blur-2xl animate-lens-flare-3"></div>
        <div className="absolute bottom-10 right-10 w-12 h-12 bg-vice-orange rounded-full opacity-15 blur-md animate-lens-flare-4"></div>
      </div>

      {/* Top Status Bar */}
      <div className="relative z-40 flex items-center justify-between p-4 bg-black/30 backdrop-blur-md border-b border-vice-cyan/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-vice-pink to-vice-cyan flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{profile?.full_name || 'User'}</p>
            <p className="text-vice-cyan/80 text-xs">{profile?.role || 'member'}</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowUserMenu(!showUserMenu)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 relative"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className="absolute top-16 right-4 bg-black/90 backdrop-blur-md border border-vice-cyan/30 rounded-lg p-2 min-w-[160px] z-50">
            {profile?.role === 'admin' && (
              <Button
                onClick={() => {
                  navigate('/admin');
                  setShowUserMenu(false);
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white hover:bg-vice-cyan/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white hover:bg-vice-pink/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-30 flex flex-col justify-center items-center min-h-[calc(100vh-200px)] px-4">
        {/* Modern Welcome Section */}
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white vice-neon-glow">
              SPR Vice City
            </h1>
            <p className="text-vice-cyan/80 text-lg font-medium">
              Violation Management System
            </p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md border border-vice-cyan/30 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-vice-pink">24</p>
                <p className="text-vice-cyan/80 text-sm">This Month</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-vice-cyan">7</p>
                <p className="text-vice-cyan/80 text-sm">This Week</p>
              </div>
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-vice-cyan/50 to-transparent"></div>
            
            <div className="text-center">
              <p className="text-white/90 text-sm">
                Ready to capture violations
              </p>
              <p className="text-vice-cyan/60 text-xs mt-1">
                Tap the menu below to get started
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        {/* Menu Buttons - Horizontal row with precise spacing */}
        {menuItems.map((item, index) => (
          <Button
            key={index}
            onClick={() => {
              item.onClick();
              setIsMenuOpen(false);
            }}
            className={`
              absolute w-14 h-14 rounded-full bg-vice-cyan/90 hover:bg-vice-cyan border-2 border-vice-pink/50 backdrop-blur-sm
              transition-all duration-300 transform shadow-lg group
              ${isMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-75 translate-y-4'
              }
            `}
            style={{
              left: `${item.xOffset}px`,
              bottom: '70px',
              transform: `translateX(-50%) ${isMenuOpen ? 'translateY(0)' : 'translateY(16px)'}`,
              transitionDelay: `${index * 75}ms`
            }}
          >
            <div className="group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </div>
          </Button>
        ))}

        {/* Hamburger Button */}
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink border-2 border-vice-cyan/50 backdrop-blur-sm transition-all duration-300 shadow-xl group"
        >
          <div className="group-hover:scale-110 transition-transform duration-200">
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </div>
        </Button>

        {/* Menu Labels */}
        {isMenuOpen && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className={`
                  absolute text-white text-xs font-medium bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md border border-vice-cyan/30
                  transition-all duration-300 transform
                  ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                `}
                style={{
                  left: `${item.xOffset}px`,
                  transform: 'translateX(-50%)',
                  transitionDelay: `${(index * 75) + 150}ms`
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating particles for extra visual appeal */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-vice-cyan rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-vice-pink rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-vice-orange rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-vice-blue rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  );
}