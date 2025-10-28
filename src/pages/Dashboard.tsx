import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Loader2, Camera, BookOpen, FileText, Download, Settings, User, LogOut, ChevronDown, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

import { SiriOrb } from '../components/ui/siri-orb';
import { cn } from '@/lib/utils';

// Import the background image properly
import backgroundImage from '/2.png';

type PresencePayload = {
  user_id: string;
  name: string;
  email: string;
  role: string;
  online_at: string;
};

type PresenceState = Record<string, PresencePayload[]>;

type PreviewMode = 'mobile' | 'tablet' | 'desktop';

export default function Dashboard() {
  const { user, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeUsers, setActiveUsers] = useState<PresenceState>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile');
  const [previewEnabled, setPreviewEnabled] = useState(false);

  // Subscribe to presence for active users
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('admin-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as PresenceState;
        setActiveUsers(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences?: PresencePayload[] }) => {
        // User joined - presence updated
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences?: PresencePayload[] }) => {
        // User left - presence updated
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const payload: PresencePayload = {
            user_id: user.id,
            name: profile?.full_name || user.email || 'User',
            email: profile?.email || user.email || '',
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

  // Debug logging removed for performance

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

  // Show Admin icon only for rob@ursllc.com (the specific admin)
  const isSpecificAdmin = profile?.role === 'admin' && user?.email === 'rob@ursllc.com';
  const shouldShowAdmin = isSpecificAdmin || (profile === null && user?.email === 'rob@ursllc.com');

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

  // Menu items configured based on role

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
    // Create a horizontal arc above the orb - wider arc to prevent overlap
    const startAngle = 155; // Upper left
    const endAngle = 25; // Upper right
    const totalAngle = startAngle - endAngle; // 130° arc for better spacing
    const angleStep = totalAngle / (totalItems > 1 ? totalItems - 1 : 1);

    const angle = startAngle - (index * angleStep); // Sweep from left to right

    // Convert to radians
    const radians = (angle * Math.PI) / 180;

    // Calculate x, y position
    const x = Math.cos(radians) * radius;
    const y = -Math.sin(radians) * radius; // negative for upward positioning

    return { x, y };
  };

  // Preview mode constraints for responsive simulation
  const previewConstraints = {
    mobile: {
      maxWidth: '390px',
      minHeight: '100vh',
      label: 'iPhone 13 (390px)',
      borderClass: 'border-vice-pink/40',
      shadowClass: 'shadow-[0_0_40px_rgba(255,20,147,0.35)]',
      bgColor: 'bg-gradient-to-br from-black/60 via-vice-purple/20 to-black/60',
    },
    tablet: {
      maxWidth: '834px',
      minHeight: '100vh',
      label: 'iPad Pro (834px)',
      borderClass: 'border-vice-cyan/40',
      shadowClass: 'shadow-[0_0_40px_rgba(0,255,255,0.35)]',
      bgColor: 'bg-gradient-to-br from-black/60 via-vice-cyan/10 to-black/60',
    },
    desktop: {
      maxWidth: '1200px',
      minHeight: '100vh',
      label: 'Desktop (1200px)',
      borderClass: 'border-white/30',
      shadowClass: 'shadow-[0_0_40px_rgba(255,255,255,0.15)]',
      bgColor: 'bg-gradient-to-br from-black/60 via-white/5 to-black/60',
    },
  } as const;

  const currentPreview = previewEnabled ? previewConstraints[previewMode] : {
    maxWidth: '100%',
    minHeight: '100vh',
    label: 'Full Width',
    borderClass: 'border-transparent',
    shadowClass: '',
    bgColor: 'bg-transparent',
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Global Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-vice-purple/30 to-black/70" />

      <div className="relative min-h-screen flex flex-col items-center">
        <div className={cn(
          "w-full flex justify-center transition-all duration-500 ease-out",
          previewEnabled ? "px-4 py-12 sm:px-6 lg:px-8" : ""
        )}>
          <div
            className={cn(
              'relative w-full overflow-hidden transition-all duration-500 ease-out',
              previewEnabled && 'border backdrop-blur-3xl',
              previewEnabled && currentPreview.borderClass,
              previewEnabled && currentPreview.shadowClass,
              previewEnabled && currentPreview.bgColor
            )}
            style={{
              maxWidth: currentPreview.maxWidth,
              minHeight: currentPreview.minHeight,
              borderRadius: previewEnabled ? (previewMode === 'desktop' ? '28px' : '36px') : '0'
            }}
          >
            {/* Preview Background - Only show when preview is enabled */}
            {previewEnabled && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-vice-purple/30 to-black/70" />
              </>
            )}

            {/* Dashboard Content */}
            <div className="relative flex flex-col min-h-full px-4 sm:px-6 lg:px-10 pb-24 pt-10">
              {/* User Avatar - Top Right */}
              <div className="absolute top-4 right-4 z-50">
                <div className="relative" ref={userMenuRef}>
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
                            <div className="text-sm text-vice-cyan font-semibold">
                              Admin
                            </div>
                          </div>
                          
                          {/* Preview ON/OFF Toggle */}
                          <Button
                            variant="ghost"
                            onClick={() => setPreviewEnabled(!previewEnabled)}
                            className={cn(
                              "relative h-8 w-8 rounded-lg transition-all duration-300 p-0",
                              previewEnabled
                                ? "bg-gradient-to-r from-vice-cyan via-vice-purple to-vice-pink shadow-md"
                                : "bg-black/40 hover:bg-vice-cyan/20 border border-white/10"
                            )}
                            title={previewEnabled ? 'Disable Preview Mode' : 'Enable Preview Mode'}
                          >
                            <Smartphone className={cn(
                              "h-4 w-4 transition-colors",
                              previewEnabled ? "text-white" : "text-white/60"
                            )} />
                          </Button>
                          
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

                                        // Hide board president from non-admin users
                                        if (profile?.role !== 'admin' && presence.email === 'missourirn@aol.com') {
                                          return null;
                                        }

                                        return (
                                          <div key={`${key}-${index}`} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/10">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 bg-gradient-to-br from-vice-cyan to-vice-blue rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-xs">
                                                  {presence.name?.[0]?.toUpperCase() || '?'}
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

              {/* Centered Navigation */}
              <div className="flex flex-1 items-center justify-center">
                <div className="relative" style={{
                  marginTop: 'clamp(30px, 6vh, 60px)',
                  marginLeft: 'clamp(-15px, -2vw, -8px)'
                }}>
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

                  {/* Siri Orb Button - Center */}
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

                  {/* Device Selection - Bottom of UI (only when preview enabled) */}
                  <AnimatePresence>
                    {previewEnabled && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
                      >
                      <div className="relative flex flex-col items-center gap-3">
                        {/* Preview Mode Label */}
                        <div className="text-xs text-vice-cyan whitespace-nowrap font-medium">
                          {currentPreview.label}
                        </div>
                        
                        {/* Device Selection */}
                        <div className="relative">
                          {/* Glow Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-vice-cyan/20 via-vice-purple/20 to-vice-pink/20 rounded-2xl blur-xl" />
                          <div className="relative flex items-center gap-1 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-1 shadow-2xl">
                            {[
                              { id: 'mobile' as PreviewMode, icon: Smartphone, label: 'Mobile' },
                              { id: 'tablet' as PreviewMode, icon: Tablet, label: 'Tablet' },
                              { id: 'desktop' as PreviewMode, icon: Monitor, label: 'Desktop' },
                            ].map((option) => (
                              <button
                                key={option.id}
                                onClick={() => setPreviewMode(option.id)}
                                className={cn(
                                  'relative flex items-center justify-center p-3 rounded-xl transition-all duration-300',
                                  previewMode === option.id
                                    ? 'bg-gradient-to-r from-vice-cyan via-vice-purple to-vice-pink text-white shadow-lg'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                )}
                                title={option.label}
                              >
                                <option.icon className="w-5 h-5" />
                                {previewMode === option.id && (
                                  <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-vice-cyan via-vice-purple to-vice-pink rounded-xl"
                                    style={{ zIndex: -1 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
