import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import {
  Loader2,
  Mail,
  Plus,
  Copy,
  Check,
  Clock,
  CheckCircle,
  Users,
  FileText,
  BarChart3,
  Home,
  Trash2
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useMediaQuery } from '../components/ui/3d-carousel';

interface Invite {
  id: string;
  email: string;
  token: string;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ViolationStats {
  total_violations: number;
  this_month: number;
  pending_violations: number;
  total_users: number;
  completed_violations: number;
  draft_violations: number;
  team_completion_rate: number;
  violations_this_week: number;
}

interface UserActivitySummary {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  total_violations: number;
  violations_this_month: number;
  violations_this_week: number;
  pending_violations: number;
  completed_violations: number;
  draft_violations: number;
  completion_rate_percent: number;
  last_violation_date: string | null;
}

interface SavedForm {
  id: string;
  user_id: string;
  unit_number: string;
  date: string;
  time: string;
  location: string;
  description: string;
  photos: string[];
  status: string;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
    role: string;
  } | null;
}

export default function Admin() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivitySummary[]>([]);
  const [stats, setStats] = useState<ViolationStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());
  
  // Violation forms state
  const [violationForms, setViolationForms] = useState<SavedForm[]>([]);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [profile]);

  const fetchViolationForms = async () => {
    try {
      // Fetch violation forms with user profile information
      let { data, error } = await supabase
        .from('violation_forms')
        .select(`
          *,
          profiles!violation_forms_user_id_fkey (
            email,
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      // If the join fails, fall back to separate queries
      if (error || !data) {
        console.log('Join query failed, falling back to separate queries:', error);

        // Fetch violation forms
        const { data: formsData, error: formsError } = await supabase
          .from('violation_forms')
          .select('*')
          .order('created_at', { ascending: false });

        if (formsError) throw formsError;

        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, role');

        if (profilesError) throw profilesError;

        // Manually join the data
        const formsWithProfiles = (formsData || []).map(form => ({
          ...form,
          profiles: profilesData?.find(profile => profile.user_id === form.user_id) || null
        }));

        setViolationForms(formsWithProfiles);
      } else {
        // Type assertion to handle the Supabase response
        const formsWithProfiles = (data || []) as unknown as SavedForm[];
        setViolationForms(formsWithProfiles);
      }
    } catch (error: any) {
      console.error('Error fetching violation forms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch violation forms",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    try {
      // Fetch invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvites(invitesData || []);

      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch user activity summary (includes individual user stats)
      // Temporarily commented out due to TypeScript type issues with database views
      // Will be re-enabled once types are updated or alternative access method is found
      /*
      const { data: userActivityData, error: userActivityError } = await supabase
        .from('user_activity_summary')
        .select('*')
        .order('total_violations', { ascending: false });

      if (userActivityError) throw userActivityError;
      setUserActivity(userActivityData || []);
      */
      // Temporary workaround - set empty array
      setUserActivity([]);

      // Fetch violation statistics for overall team metrics
      const { data: violationsData, error: violationsError } = await supabase
        .from('violation_forms')
        .select('id, created_at, status');

      if (violationsError) throw violationsError;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalViolations = violationsData?.length || 0;
      const completedViolations = violationsData?.filter(v => v.status === 'completed').length || 0;

      const stats: ViolationStats = {
        total_violations: totalViolations,
        this_month: violationsData?.filter(v => new Date(v.created_at) >= thisMonth).length || 0,
        violations_this_week: violationsData?.filter(v => new Date(v.created_at) >= thisWeek).length || 0,
        pending_violations: violationsData?.filter(v => v.status === 'pending').length || 0,
        completed_violations: completedViolations,
        draft_violations: violationsData?.filter(v => v.status === 'saved').length || 0,
        total_users: profilesData?.length || 0,
        team_completion_rate: totalViolations > 0 ? Math.round((completedViolations / totalViolations) * 100) : 0
      };

      setStats(stats);

      // Fetch violation forms for display
      await fetchViolationForms();

    } catch (error: any) {
      console.error('Admin data fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setCreating(true);
    try {
      const { error } = await supabase.rpc('create_invite', {
        invite_email: email
      });

      if (error) throw error;

      setEmail('');
      await fetchData();
      toast({
        title: "Invite Created",
        description: `Invitation sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Create Invite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/auth?invite=${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedTokens(prev => new Set([...prev, token]));
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
      setTimeout(() => {
        setCopiedTokens(prev => {
          const newSet = new Set(prev);
          newSet.delete(token);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy invite link",
        variant: "destructive",
      });
    }
  };

  const deleteViolationForm = async (formId: string) => {
    setDeletingFormId(formId);
    try {
      const { error } = await supabase
        .from('violation_forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;

      // Refresh the data after deletion
      await fetchData();
      
      toast({
        title: "Success",
        description: "Violation form deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting violation form:', error);
      toast({
        title: "Error",
        description: "Failed to delete violation form",
        variant: "destructive",
      });
    } finally {
      setDeletingFormId(null);
    }
  };

  const getThisWeekForms = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return violationForms.filter(form => new Date(form.created_at) >= weekAgo);
  };

  const getThisMonthForms = () => {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return violationForms.filter(form => new Date(form.created_at) >= monthAgo);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get pending invitations (not used and not expired)
  const getPendingInvites = () => {
    return invites.filter(invite => 
      !invite.used_at && new Date(invite.expires_at) > new Date()
    );
  };

  // 3D Carousel component for violation forms
  const ViolationCarousel = ({ forms, period }: { forms: SavedForm[], period: string }) => {
    const [activeImg, setActiveImg] = useState<string | null>(null);
    const [isCarouselActive, setIsCarouselActive] = useState(true);
    const controls = useAnimation();
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)");

    // Create carousel items from violation forms, or use placeholder items if no forms
    const carouselItems = forms.length > 0
      ? forms.map((form, index) => ({
        id: form.id,
        imageUrl: form.photos[0] || `https://picsum.photos/400/400?violation-${index}`,
        date: new Date(form.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        unit: form.unit_number,
        description: form.description
      }))
      : [
        // Placeholder items when no forms exist
        {
          id: 'placeholder-1',
          imageUrl: 'placeholder',
          date: '',
          unit: '',
          description: ''
        },
        {
          id: 'placeholder-2',
          imageUrl: 'placeholder',
          date: '',
          unit: '',
          description: ''
        },
        {
          id: 'placeholder-3',
          imageUrl: 'placeholder',
          date: '',
          unit: '',
          description: ''
        }
      ];

    // Carousel dimensions optimized for admin view
    const cylinderWidth = isScreenSizeSm ? 500 : 800;
    const faceCount = carouselItems.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);
    const rotation = useMotionValue(0);
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    );

    const handleClick = (imgUrl: string) => {
      // prevent opening the modal for placeholders
      if (imgUrl !== 'placeholder') {
        setActiveImg(imgUrl);
        setIsCarouselActive(false);
        controls.stop();
      }
    };

    const handleClose = () => {
      setActiveImg(null);
      setIsCarouselActive(true);
    };

    return (
      <div className="w-full">
        <motion.div layout className="relative">
          <AnimatePresence mode="sync">
            {activeImg && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                layoutId={`img-container-${activeImg}`}
                layout="position"
                onClick={handleClose}
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 m-5 md:m-36 lg:mx-[19rem] rounded-3xl"
                style={{ willChange: "opacity" }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              >
                <motion.img
                  layoutId={`img-${activeImg}`}
                  src={activeImg}
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.5,
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  style={{
                    willChange: "transform",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Carousel container with Vice City styling */}
          <div className="relative h-[180px] w-full overflow-hidden rounded-lg bg-black/30 border border-vice-cyan/30">
            <div
              className="flex h-full items-center justify-center bg-black/20"
              style={{
                perspective: "1000px",
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <motion.div
                drag={isCarouselActive ? "x" : false}
                className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
                style={{
                  transform,
                  rotateY: rotation,
                  width: cylinderWidth,
                  transformStyle: "preserve-3d",
                }}
                onDrag={(_, info) =>
                  isCarouselActive &&
                  rotation.set(rotation.get() + info.offset.x * 0.05)
                }
                onDragEnd={(_, info) =>
                  isCarouselActive &&
                  controls.start({
                    rotateY: rotation.get() + info.velocity.x * 0.05,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 30,
                      mass: 0.1,
                    },
                  })
                }
                animate={controls}
              >
                {carouselItems.map((item, i) => (
                  <motion.div
                    key={`key-${item.imageUrl}-${i}`}
                    className="absolute flex h-full origin-center items-center justify-center rounded-xl p-3"
                    style={{
                      width: `${faceWidth}px`,
                      transform: `rotateY(${i * (360 / faceCount)
                        }deg) translateZ(${radius}px)`,
                    }}
                    onClick={() => handleClick(item.imageUrl)}
                  >
                    {item.imageUrl === 'placeholder' ? (
                      // Placeholder with Vice City styling
                      <div className="w-full h-3/4 rounded-lg bg-black border border-vice-pink shadow-[0_0_8px_#ff1493,0_0_16px_#00ffff] flex items-center justify-center">
                        <div className="text-vice-cyan text-xs text-center opacity-60">No Data</div>
                      </div>
                    ) : (
                      <motion.img
                        src={item.imageUrl}
                        alt={`${item.unit} ${item.date}`}
                        layoutId={`img-${item.imageUrl}`}
                        className="pointer-events-none w-full h-3/4 rounded-lg object-cover border border-vice-cyan shadow-[0_0_6px_#00ffff,0_0_12px_#ff1493]"
                        initial={{ filter: "blur(4px)" }}
                        layout="position"
                        animate={{ filter: "blur(0px)" }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Info overlay */}
            {forms.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm rounded-md p-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-vice-pink font-medium">{period}</span>
                  <span className="text-vice-cyan">{forms.length} forms</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // Show loading while checking auth or profile
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not admin
  if (profile && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-vice-cyan/20 relative">
        <div className="flex-1 flex justify-center">
          <img
            src="/admin_zoomed.png"
            alt="Admin Panel"
            className="h-16 w-auto"
          />
        </div>
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 absolute right-4"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Violation Forms Section - Moved to top and centered title */}
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-vice-cyan" />
              Violation Forms Management
            </CardTitle>
            <CardDescription className="text-gray-300">
              Manage all team violation forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* This Week Carousel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-vice-pink" />
                  <span className="text-white font-medium">This Week ({getThisWeekForms().length})</span>
                </div>
                <ViolationCarousel forms={getThisWeekForms()} period="This Week" />
              </div>

              {/* This Month Carousel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-vice-pink" />
                  <span className="text-white font-medium">This Month ({getThisMonthForms().length})</span>
                </div>
                <ViolationCarousel forms={getThisMonthForms()} period="This Month" />
              </div>

              {/* All Forms Carousel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-vice-pink" />
                  <span className="text-white font-medium">All Forms ({violationForms.length})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Overview */}
        {userActivity.length > 0 && (
          <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-vice-cyan" />
                Team Performance
              </CardTitle>
              <CardDescription className="text-gray-300">
                Individual user activity and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-vice-purple to-vice-pink rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email} • {user.role === 'admin' ? 'Admin' : 'User'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-white font-bold">{user.total_violations}</div>
                        <div className="text-gray-400">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-vice-pink font-bold">{user.violations_this_month}</div>
                        <div className="text-gray-400">This Month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">{user.pending_violations}</div>
                        <div className="text-gray-400">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{user.completed_violations}</div>
                        <div className="text-gray-400">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">{user.completion_rate_percent}%</div>
                        <div className="text-gray-400">Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300 font-bold">
                          {user.last_violation_date
                            ? new Date(user.last_violation_date).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                        <div className="text-gray-400">Last Activity</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Invite */}
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-vice-pink" />
              Create New Invite
            </CardTitle>
            <CardDescription className="text-gray-300">
              Send an invitation to a new team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createInvite} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@ursllc.com"
                  className="bg-black/20 border-vice-cyan/30 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={creating || !email}
                className="bg-vice-pink hover:bg-vice-pink/80 text-white self-end"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Create Invite
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Team Members</CardTitle>
            <CardDescription className="text-gray-300">
              Current registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No users found</p>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div
                    key={profile.user_id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-vice-cyan/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {profile.full_name || profile.email}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            profile.role === 'admin'
                              ? "bg-vice-pink/20 text-vice-pink border-vice-pink/30"
                              : "bg-vice-cyan/20 text-vice-cyan border-vice-cyan/30"
                          }
                        >
                          {profile.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        {profile.email} • Joined: {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations - Moved to bottom and renamed */}
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Pending Invitations</CardTitle>
            <CardDescription className="text-gray-300">
              Invitations sent but not yet activated
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getPendingInvites().length === 0 ? (
              <p className="text-gray-400 text-center py-4">No pending invitations found</p>
            ) : (
              <div className="space-y-3">
                {getPendingInvites().map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-vice-cyan/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{invite.email}</span>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        Created: {new Date(invite.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <Button
                      onClick={() => copyInviteLink(invite.token)}
                      variant="outline"
                      size="sm"
                      className="border-vice-cyan/30 text-vice-cyan hover:bg-vice-cyan/10"
                    >
                      {copiedTokens.has(invite.token) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}