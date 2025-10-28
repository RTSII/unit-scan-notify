import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
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
  ChevronDown,
  Key,
  Search,
  Filter,
  Film,
  Grid3X3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
  violation_photos?: Pick<ViolationPhotoRow, 'id' | 'storage_path' | 'created_at'>[] | null;
  profiles?: Pick<ProfileRow, 'user_id' | 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at'> | null;
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
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [emailSubject, setEmailSubject] = useState('You\'re Invited to SPR Vice City');
  const [emailMessage, setEmailMessage] = useState('');
  
  // Violation forms state
  const [violationForms, setViolationForms] = useState<SavedForm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'this_week' | 'this_month' | 'all'>('this_week');
  const [debouncedTimeFilter, setDebouncedTimeFilter] = useState<'this_week' | 'this_month' | 'all'>('this_week');
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  // Profile card state
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeUsers, setActiveUsers] = useState<PresenceState>({});
  const hasFetchedDataRef = useRef(false);

  const fetchViolationForms = useCallback(async () => {
    try {
      // Server-side time filter (coarse on created_at) and limit to first photo for carousel
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date | null = null;
      if (debouncedTimeFilter === 'this_week') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
      } else if (debouncedTimeFilter === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      let baseQuery = supabase
        .from('violation_forms')
        .select(`
          *,
          violation_photos (
            id,
            storage_path,
            created_at
          )
        `);

      if (startDate) {
        const startIso = startDate.toISOString();
        baseQuery = baseQuery.filter('created_at', 'gte', startIso);
      }

      // Smart query limits: Admin needs more data but still optimize by filter
      const queryLimit = debouncedTimeFilter === 'this_week' ? 100 : debouncedTimeFilter === 'this_month' ? 200 : 350;

      const { data: formsData, error: formsError } = await baseQuery
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'violation_photos', ascending: false })
        .limit(queryLimit)
        .limit(1, { foreignTable: 'violation_photos' });

      if (formsError) throw formsError;

      // Map forms without profiles (profiles join removed due to missing FK)
      const formsWithProfiles = (formsData ?? []).map((form) => {
        return normalizeFormRecord(form as unknown as JoinedViolationForm, null);
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
  }, [toast, debouncedTimeFilter]);

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

      const rpcRes = await (supabase.rpc as any)('get_violation_stats');
      if (rpcRes.error) throw rpcRes.error;
      const row = (Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data) ?? {};

      const statsPayload: ViolationStats = {
        total_violations: Number(row.total_violations ?? 0),
        this_month: Number(row.this_month ?? 0),
        violations_this_week: Number(row.violations_this_week ?? 0),
        pending_violations: Number(row.pending_violations ?? 0),
        completed_violations: Number(row.completed_violations ?? 0),
        draft_violations: Number(row.draft_violations ?? 0),
        team_completion_rate: Number(row.team_completion_rate ?? 0),
        total_users: 0,
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
    if (user && !hasFetchedDataRef.current) {
      hasFetchedDataRef.current = true;
      fetchData();
    }
  }, [user]);

  // Debounce time filter changes to prevent multiple rapid API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTimeFilter(timeFilter);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [timeFilter]);

  // Refetch just violation forms when debouncedTimeFilter changes
  useEffect(() => {
    if (user) {
      fetchViolationForms();
    }
  }, [user, debouncedTimeFilter, fetchViolationForms]);

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


  // Get filtered forms based on time filter and search
  const getFilteredForms = () => {
    let filtered = violationForms;

    // Apply time filter first
    if (timeFilter === 'this_week') {
      filtered = getThisWeekForms();
    } else if (timeFilter === 'this_month') {
      filtered = getThisMonthForms();
    }

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(form => {
        const unitMatch = form.unit_number?.toLowerCase().includes(searchTermLower);
        const descMatch = form.description?.toLowerCase().includes(searchTermLower);
        const locationMatch = form.location?.toLowerCase().includes(searchTermLower);
        const userMatch = form.profiles?.email?.toLowerCase().includes(searchTermLower) ||
          form.profiles?.full_name?.toLowerCase().includes(searchTermLower);
        
        // Date matching
        const dateStr = form.occurred_at || form.date || '';
        const dateMatch = dateStr.toLowerCase().includes(searchTermLower);
        
        return Boolean(unitMatch || descMatch || locationMatch || userMatch || dateMatch);
      });
    }

    return filtered;
  };

  // Get time filter label
  const getTimeFilterLabel = () => {
    if (debouncedTimeFilter === 'this_week') return 'This Week';
    if (debouncedTimeFilter === 'this_month') return 'This Month';
    return 'All Forms';
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 5; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedToken(token);
    setShowEmailTemplate(true);
    setEmailMessage(`Hello,

You've been invited to join SPR Vice City! Use the validation token below to complete your registration:

Validation Token: ${token}

This invite will expire in 7 days.

Welcome to the team!`);
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !generatedToken) return;

    setCreating(true);
    try {
      // Save to Supabase with the generated token
      const { error } = await supabase
        .from('invites')
        .insert({
          email: email,
          token: generatedToken,
          invited_by: user?.id
        });

      if (error) throw error;

      // TODO: Send email via edge function
      // await supabase.functions.invoke('send-invite-email', {
      //   body: { email, token: generatedToken, subject: emailSubject, message: emailMessage }
      // });

      toast({
        title: "Invite Created & Sent",
        description: `Invitation sent to ${email}`,
      });

      setEmail('');
      setGeneratedToken(null);
      setShowEmailTemplate(false);
      await fetchData();
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Past 6 days + today = 7 days total (matches Books.tsx)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6);
    
    const filtered = violationForms.filter(form => {
      const formDate = new Date(form.occurred_at || form.created_at);
      // Normalize to date only (ignore time)
      const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
      return formDateOnly >= startOfWeek;
    });
    
    filtered.sort((a, b) => {
      const ad = new Date(a.occurred_at || a.created_at || 0).getTime();
      const bd = new Date(b.occurred_at || b.created_at || 0).getTime();
      return bd - ad;
    });
    return filtered;
  };

  const getThisMonthForms = () => {
    const now = new Date();
    // Start of current month (matches Books.tsx)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const filtered = violationForms.filter(form => {
      const formDate = new Date(form.occurred_at || form.created_at);
      // Normalize to date only (ignore time)
      const formDateOnly = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
      return formDateOnly >= startOfMonth;
    });
    
    filtered.sort((a, b) => {
      const ad = new Date(a.occurred_at || a.created_at || 0).getTime();
      const bd = new Date(b.occurred_at || b.created_at || 0).getTime();
      return bd - ad;
    });
    return filtered;
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

  // Show loading while checking auth
  if (loading) {
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

  // Redirect if not admin (specifically rob@ursllc.com)
  if (profile && (profile.role !== 'admin' || user?.email !== 'rob@ursllc.com')) {
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
      <div className="relative z-30 min-h-screen">
        {/* Header with centered Admin.png image */}
        <div className="relative flex items-center p-6 bg-black backdrop-blur-sm border-b border-vice-cyan/20 overflow-hidden">
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img
              src="/Admin.png"
              alt="Admin Panel"
              className="h-32 sm:h-24 w-auto object-contain"
            />
          </div>
          {/* Black gradient masks on all sides to blend logo */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
          <div className="ml-auto">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-vice-cyan/20 min-h-[44px] min-w-[44px]"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Integrated Search + Filter */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-stretch gap-0 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-vice-cyan/30 bg-gradient-to-br from-black/50 via-black/40 to-black/30 backdrop-blur-sm">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vice-cyan/80" />
                <Input
                  placeholder="Search Unit #, Date, or Violation type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-transparent border-0 text-white placeholder:text-vice-cyan/70 min-h-[48px] w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {/* Divider */}
              <div className="self-stretch w-px bg-vice-cyan/30" />
              {/* Filter */}
              <div className="w-auto">
                <Select value={timeFilter} onValueChange={(value: 'this_week' | 'this_month' | 'all') => setTimeFilter(value)}>
                  <SelectTrigger className="h-[48px] bg-transparent border-0 text-white rounded-none justify-start px-3 w-auto">
                    <Filter className="w-4 h-4 mr-2 text-vice-cyan/80 flex-shrink-0" />
                    <SelectValue placeholder="Filter by time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-vice-cyan/50 w-auto">
                    <SelectItem value="this_week" className="text-white hover:bg-vice-cyan/20">
                      <div className="flex items-center gap-2">
                        <Film className={`w-4 h-4 ${timeFilter === 'this_week' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
                        <span>This Week</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="this_month" className="text-white hover:bg-vice-cyan/20">
                      <div className="flex items-center gap-2">
                        <Film className={`w-4 h-4 ${timeFilter === 'this_month' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
                        <span>This Month</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="all" className="text-white hover:bg-vice-cyan/20">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className={`w-4 h-4 ${timeFilter === 'all' ? 'text-vice-pink' : 'text-vice-cyan'}`} />
                        <span>All Forms</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

        {/* Unified Violation Forms Section with 3D Carousel */}
        <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-vice-cyan" />
              {getTimeFilterLabel()} ({getFilteredForms().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ViolationCarousel3D 
              forms={getFilteredForms()} 
              onDelete={deleteViolationForm}
              heightClass={debouncedTimeFilter === 'all' ? "h-[400px] sm:h-[500px]" : "h-[320px] sm:h-[400px]"}
              containerClassName="mx-auto"
              displayMode={debouncedTimeFilter === 'all' ? 'grid' : '3d-carousel'}
            />
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
            <div className="space-y-4">
              <div className="flex gap-4">
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
              </div>

              <Button
                onClick={generateToken}
                disabled={!email}
                className="w-full bg-vice-cyan hover:bg-vice-cyan/80 text-black"
              >
                <Key className="w-4 h-4 mr-2" />
                Generate Token
              </Button>

              {/* Email Template Card - Expands after token generation */}
              {showEmailTemplate && generatedToken && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-black/40 border border-vice-cyan/30 rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => {
                        setShowEmailTemplate(false);
                        setGeneratedToken(null);
                        setEmail('');
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Badge className="bg-vice-cyan/20 text-vice-cyan border-vice-cyan/30">
                      Token: {generatedToken}
                    </Badge>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-white">Subject</Label>
                    <Input
                      id="subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="bg-black/20 border-vice-cyan/30 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white">Message</Label>
                    <Textarea
                      id="message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={8}
                      className="bg-black/20 border-vice-cyan/30 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <form onSubmit={createInvite}>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="w-full bg-vice-pink hover:bg-vice-pink/80 text-white"
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Submit / Send Invitation
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </div>
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
    </div>
  );
}
