import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Download, Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../integrations/supabase/client';

import { SiriOrb } from '../components/ui/siri-orb';

// Import the background image properly
import backgroundImage from '/2.png';

type PresencePayload = {
  user_id: string;
  name: string;
  role: string;
  online_at: string;
};

type PresenceState = Record<string, PresencePayload[]>;

export default function Dashboard() {
  const { user, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeUsers, setActiveUsers] = useState<PresenceState>({});
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Subscribe to presence for active users
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('admin-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as PresenceState;
        setActiveUsers(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences?: PresencePayload[] }) => {
        console.log('New user joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences?: PresencePayload[] }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const payload: PresencePayload = {
            user_id: user.id,
            name: profile?.full_name || user.email || 'User',
            role: profile?.role || 'user',
            online_at: new Date().toISOString(),
          };
          await channel.track(payload);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

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
        setProfileExpanded(false);
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

  // Show Admin icon in the arc for admins; fallback-show for Rob while profile is loading
  const isAdmin = profile?.role === 'admin';
  const shouldShowAdmin = isAdmin || (profile === null && user?.email === 'rob@ursllc.com');

  // Order with Admin taking Export's previous spot and Export shifting left
  const menuItems = shouldShowAdmin
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
  console.log('Menu items count:', menuItems.length, 'Is admin:', isAdmin);

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
    const totalAngle = totalItems > 4 ? 150 : 170; // Tighter spacing when Admin is visible
    const angleStep = totalAngle / (totalItems > 1 ? totalItems - 1 : 1);
    const startAngle = 180; // Start arc from directly above orb (12 o'clock)

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
            <div className="absolute right-0 top-12 w-80 bg-black/90 backdrop-blur-sm border border-vice-cyan/30 rounded-lg shadow-xl z-50">
              <div className="px-3 py-2 border-b border-vice-cyan/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-vice-purple to-vice-pink rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-white font-medium">
                      {profile?.full_name || user?.email || 'User'}
                    </div>
                    <div className="text-sm text-vice-cyan">
                      {profile?.role || 'user'}
                    </div>
                  </div>
                  <button
                    onClick={() => setProfileExpanded(!profileExpanded)}
                    className="p-1 hover:bg-vice-cyan/20 rounded transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: profileExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-vice-cyan" />
                    </motion.div>
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {profileExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden border-b border-vice-cyan/20"
                  >
                    <div className="p-3">
                      <div className="bg-black/40 rounded-lg p-3 border border-vice-cyan/20">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          Active Users
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Object.keys(activeUsers).length === 0 ? (
                            <div className="text-gray-400 text-xs">No other users currently active</div>
                          ) : (
                            Object.entries(activeUsers).map(([key, presences]) =>
                              presences.map((presence, index) => {
                                // Don't show current user in the list
                                if (presence.user_id === user?.id) return null;
                                
                                return (
                                  <div key={`${key}-${index}`} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/10">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-vice-cyan to-vice-blue rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xs">
                                          {presence.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-white font-medium text-xs">
                                          {presence.name}
                                        </div>
                                        <div className="text-xs text-vice-cyan">
                                          {presence.role}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-2 py-1 rounded">
                                      Active
                                    </div>
                                  </div>
                                );
                              })
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
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
