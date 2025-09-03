import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Plus, Copy, Check, Clock, CheckCircle } from 'lucide-react';

interface Invite {
  id: string;
  email: string;
  token: string;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export default function AdminInvites() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch invites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchInvites();
    } else {
      setLoading(false);
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
      await fetchInvites();
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
        title: "Failed to Copy",
        description: "Could not copy invite link",
        variant: "destructive",
      });
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-black/40 border-vice-cyan/30">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-vice-pink" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-vice-cyan/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-vice-pink" />
            Create New Invite
          </CardTitle>
          <CardDescription className="text-vice-cyan/80">
            Send an invitation to allow someone to register
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInvite} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/30 border-vice-cyan/30 text-white placeholder:text-vice-cyan/40"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={creating}
              className="bg-vice-pink hover:bg-vice-purple"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-vice-cyan/30">
        <CardHeader>
          <CardTitle className="text-white">Pending Invites</CardTitle>
          <CardDescription className="text-vice-cyan/80">
            Manage sent invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invites.length === 0 ? (
              <p className="text-vice-cyan/60 text-center py-4">No invites created yet</p>
            ) : (
              invites.map((invite) => (
                <div 
                  key={invite.id} 
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-vice-cyan/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {invite.used_at ? (
                        <Badge variant="outline" className="text-vice-cyan border-vice-cyan/50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Used
                        </Badge>
                      ) : new Date(invite.expires_at) < new Date() ? (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-vice-pink border-vice-pink/50">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <span className="text-xs text-vice-cyan/60">
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!invite.used_at && new Date(invite.expires_at) >= new Date() && (
                    <Button
                      onClick={() => copyInviteLink(invite.token)}
                      size="sm"
                      variant="outline"
                      className="ml-2 border-vice-cyan/50 text-vice-cyan hover:bg-vice-cyan/10"
                    >
                      {copiedTokens.has(invite.token) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}