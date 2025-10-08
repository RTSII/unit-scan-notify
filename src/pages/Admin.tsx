import { useState, useEffect, useRef, useCallback } from 'react';
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
  User,
  ChevronDown
} from 'lucide-react';
import {
  AnimatePresence,
  motion
} from "framer-motion";
import { ViolationCarousel3D } from '../components/ViolationCarousel';
import type { Tables } from '../integrations/supabase/types';

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
  occurred_at?: string | null;
  date?: string | null;
  time?: string | null;
  location: string | null;
  description: string | null;
  photos: string[];
  status: string | null;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
    role: string;
  } | null;
  violation_photos?: Array<{
    id: string;
    storage_path: string;
    created_at: string;
  }>;
}

type PresencePayload = {
  user_id: string;
  name: string;
  role: string;
  online_at: string;
};

type PresenceState = Record<string, PresencePayload[]>;

type ViolationFormRow = Tables<'violation_forms'>;
type ViolationPhotoRow = Tables<'violation_photos'>;
type ProfileRow = Tables<'profiles'>;
type JoinedViolationForm = ViolationFormRow & {
  violation_photos?: ViolationPhotoRow[] | null;
  profiles?: Pick<ProfileRow, 'email' | 'full_name' | 'role'> | null;
  date?: string | null;
  time?: string | null;
};

const normalizeFormRecord = (
  form: JoinedViolationForm,
  profileOverride?: Pick<ProfileRow, 'email' | 'full_name' | 'role'> | null
): SavedForm => {
  const violationPhotosRaw: ViolationPhotoRow[] = Array.isArray(form?.violation_photos)
    ? (form.violation_photos ?? []).filter(
        (photo): photo is ViolationPhotoRow => Boolean(photo)
      )
    : [];
  const rawProfile = form?.profiles ?? profileOverride ?? null;

  const normalizedProfile = rawProfile
    ? {
        email: rawProfile.email ?? '',
        full_name: rawProfile.full_name ?? null,
        role: rawProfile.role ?? 'user',
      }
    : null;

  const photos = violationPhotosRaw
    .map((photo) => photo.storage_path)
    .filter((path): path is string => typeof path === 'string' && path.length > 0);

  return {
    id: String(form.id),
    user_id: form.user_id,
    unit_number: form.unit_number ?? '',
    occurred_at: form.occurred_at ?? null,
    date: form.date ?? null,
    time: form.time ?? null,
    location: form.location ?? null,
    description: form.description ?? null,
    photos,
    status: form.status ?? null,
    created_at: form.created_at ?? new Date().toISOString(),
    profiles: normalizedProfile,
    violation_photos: violationPhotosRaw
      .map((photo) => ({
        id: String(photo.id),
        storage_path: photo.storage_path ?? '',
        created_at: photo.created_at ?? '',
      }))
      .filter((photo) => photo.storage_path.length > 0),
  };
};

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
  const [activeSection, setActiveSection] = useState<'week' | 'month' | 'all' | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  // Profile card state
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeUsers, setActiveUsers] = useState<PresenceState>({});
  const sectionsTopRef = useRef<HTMLDivElement>(null);
  const hasFetchedDataRef = useRef(false);

  const fetchViolationForms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('violation_forms')
        .select(`
          *,
          profiles!violation_forms_user_id_fkey (
            email,
            full_name,
            role
          ),
          violation_photos (
            id,
            storage_path,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
        .returns<JoinedViolationForm[]>();

      if (!error && data) {
        const formsWithProfiles = data.map((form) => normalizeFormRecord(form));
        setViolationForms(formsWithProfiles);
        return;
      }

      console.warn('Join query failed, using fallback profile join', error);

      const { data: formsData, error: formsError } = await supabase
        .from('violation_forms')
        .select(`
          *,
          violation_photos (
            id,
            storage_path,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
        .returns<JoinedViolationForm[]>();

      if (formsError) throw formsError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, role, created_at, updated_at')
        .returns<ProfileRow[]>();

      if (profilesError) throw profilesError;

      const formsWithProfiles = (formsData ?? []).map((form) => {
        const matchedProfile =
          profilesData?.find((profile) => profile.user_id === form.user_id) ?? null;
        return normalizeFormRecord(form, matchedProfile);
      });

      setViolationForms(formsWithProfiles);
    } catch (error: unknown) {
      console.error('Error fetching violation forms:', error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch violation forms",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchData = useCallback(async () => {
    try {
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
        .returns<Invite[]>();

      if (invitesError) throw invitesError;
      setInvites(invitesData ?? []);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
        .returns<ProfileRow[]>();

      if (profilesError) throw profilesError;
      const profileRows = profilesData ?? [];
      setProfiles(
        profileRows.map((profileRecord) => ({
          user_id: profileRecord.user_id,
          email: profileRecord.email,
          full_name: profileRecord.full_name,
          role: profileRecord.role ?? 'user',
          created_at: profileRecord.created_at,
          updated_at: profileRecord.updated_at,
        }))
      );

      setUserActivity([]);

      const { data: violationsData, error: violationsError } = await supabase
        .from('violation_forms')
        .select('id, created_at, status')
        .returns<Pick<ViolationFormRow, 'id' | 'created_at' | 'status'>[]>();

      if (violationsError) throw violationsError;

      const violationRows = violationsData ?? [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalViolations = violationRows.length;
      const completedViolations = violationRows.filter((row) => row.status === 'completed').length;

      const statsPayload: ViolationStats = {
        total_violations: totalViolations,
        this_month: violationRows.filter(
          (row) => new Date(row.created_at) >= thisMonth
        ).length,
        violations_this_week: violationRows.filter(
          (row) => new Date(row.created_at) >= thisWeek
        ).length,
        pending_violations: violationRows.filter((row) => row.status === 'pending').length,
        completed_violations: completedViolations,
        draft_violations: violationRows.filter((row) => row.status === 'saved').length,
        total_users: 0,
        team_completion_rate:
          totalViolations > 0
            ? Math.round((completedViolations / totalViolations) * 100)
            : 0,
      };

      setStats(statsPayload);
      await fetchViolationForms();
    } catch (error: unknown) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }, [fetchViolationForms, toast]);

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    if (profile?.role === 'admin' && !hasFetchedDataRef.current) {
      hasFetchedDataRef.current = true;
      fetchData();
    }
  }, [profile?.role]);

  // Set up real-time presence tracking
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const channel = supabase.channel('admin_presence');
    
    // Subscribe to presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState() as PresenceState;
        setActiveUsers(newState);
      })
      .on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        console.log('User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        console.log('User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence
          const userPresence: PresencePayload = {
            user_id: user.id,
            name: profile?.full_name || user.email || 'Unknown',
            role: profile?.role || 'user',
            online_at: new Date().toISOString(),
          };

          await channel.track(userPresence);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // Scroll to the violations stack when a section is toggled
  useEffect(() => {
    if (activeSection && sectionsTopRef.current) {
      sectionsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  const renderSection = (type: 'week' | 'month' | 'all') => {
    const isActive = activeSection === type;
    const toggle = () => setActiveSection(prev => (prev === type ? null : type));
    if (type === 'week') {
      return (
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm overflow-hidden">
          <button
            onClick={toggle}
            className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-vice-pink" />
              <span className="text-white font-medium text-lg">This Week ({getThisWeekForms().length})</span>
            </div>
            <motion.div
              animate={{ rotate: isActive ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5 text-vice-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0">
                  <ViolationCarousel3D forms={getThisWeekForms()} onDelete={deleteViolationForm} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      );
    }
    if (type === 'month') {
      return (
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm overflow-hidden">
          <button
            onClick={toggle}
            className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-vice-pink" />
              <span className="text-white font-medium text-lg">This Month ({getThisMonthForms().length})</span>
            </div>
            <motion.div
              animate={{ rotate: isActive ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5 text-vice-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0">
                  <ViolationCarousel3D forms={getThisMonthForms()} onDelete={deleteViolationForm} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      );
    }
    // all
    return (
      <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm overflow-hidden">
        <button
          onClick={toggle}
          className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-vice-pink" />
            <span className="text-white font-medium text-lg">All Forms ({violationForms.length})</span>
          </div>
          <motion.div
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-5 h-5 text-vice-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <ViolationCarousel3D forms={violationForms} onDelete={deleteViolationForm} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Failed to Create Invite",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.clipboard
    ) {
      toast({
        title: "Clipboard Unavailable",
        description: "Unable to copy invite link in this environment.",
        variant: "destructive",
      });
      return;
    }

    const inviteLink = `${window.location.origin}/auth?invite=${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedTokens(prev => {
        const next = new Set(prev);
        next.add(token);
        return next;
      });
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
      setTimeout(() => {
        setCopiedTokens(prev => {
          const next = new Set(prev);
          next.delete(token);
          return next;
        });
      }, 2000);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not copy invite link";
      toast({
        title: "Failed to copy",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deleteViolationForm = async (formId: string) => {
    setDeletingFormId(formId);
    try {
      const numericId = Number(formId);
      if (Number.isNaN(numericId)) {
        throw new Error('Invalid violation form id');
      }
      const { error } = await supabase
        .from('violation_forms')
        .delete()
        .eq('id', numericId);

      if (error) throw error;

      // Refresh the data after deletion
      await fetchData();
      
      toast({
        title: "Success",
        description: "Violation form deleted successfully",
      });
    } catch (error: unknown) {
      console.error('Error deleting violation form:', error);
      const message =
        error instanceof Error ? error.message : "Failed to delete violation form";
      toast({
        title: "Error",
        description: message,
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
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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

  const baseSections: Array<'week' | 'month' | 'all'> = ['week', 'month', 'all'];
  const orderedSections = activeSection
    ? [activeSection, ...baseSections.filter((section) => section !== activeSection)]
    : baseSections;

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-vice-cyan/20 relative">
        <div className="flex-1 h-full flex items-center justify-center">
          <img
            src="/Admin.png"
            alt="Admin Panel"
            className="h-3/4 w-auto"
          />
        </div>
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 absolute right-4 top-1/2 -translate-y-1/2"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Card with Active Users - REMOVED */}
        {/* This profile section has been moved to Dashboard page profile avatar */}

        {/* Violation Forms Section with Dropdown Style - Active section floats to top */}
        <div className="space-y-4">
          {orderedSections.map((section) => (
            <div key={section}>{renderSection(section)}</div>
          ))}
        </div>

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
