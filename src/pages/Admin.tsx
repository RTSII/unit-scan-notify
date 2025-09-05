import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Mail,
  Plus,
  Copy,
  Check,
  Clock,
  CheckCircle,
  ArrowLeft,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';

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
      const { data: userActivityData, error: userActivityError } = await supabase
        .from('user_activity_summary')
        .select('*')
        .order('total_violations', { ascending: false });

      if (userActivityError) throw userActivityError;
      setUserActivity(userActivityData || []);

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

useEffect(() => {
  if (profile?.role === 'admin') {
    fetchData();
  }
}, [profile]);

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
    <div className="flex items-center justify-between mb-6 pt-safe">
      <Button
        onClick={() => navigate('/dashboard')}
        variant="ghost"
        className="text-white hover:bg-white/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <div className="w-24" /> {/* Spacer for centering */}
    </div>

    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-vice-cyan mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total_violations}</div>
              <div className="text-sm text-gray-300">Total Violations</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-vice-pink/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-vice-pink mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.this_month}</div>
              <div className="text-sm text-gray-300">This Month</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-purple-400/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.violations_this_week}</div>
              <div className="text-sm text-gray-300">This Week</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-yellow-400/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.pending_violations}</div>
              <div className="text-sm text-gray-300">Pending</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-green-400/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.completed_violations}</div>
              <div className="text-sm text-gray-300">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-blue-400/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.team_completion_rate}%</div>
              <div className="text-sm text-gray-300">Completion Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Active Invites */}
      <Card className="bg-black/30 border-vice-cyan/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Active Invitations</CardTitle>
          <CardDescription className="text-gray-300">
            Manage pending invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No invitations found</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-vice-cyan/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{invite.email}</span>
                      {invite.used_at ? (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Used
                        </Badge>
                      ) : new Date(invite.expires_at) < new Date() ? (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      Created: {new Date(invite.created_at).toLocaleDateString()}
                      {invite.used_at && (
                        <span className="ml-4">
                          Used: {new Date(invite.used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {!invite.used_at && new Date(invite.expires_at) > new Date() && (
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
                  )}
                </div>
              ))}
            </div>
          )}
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
    </div>
  </div>
);
}