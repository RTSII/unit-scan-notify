import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Conversation {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  message_count: number;
  last_message_at: string;
}

export function ConversationsDialog({ open, onOpenChange }: ConversationsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // This is a placeholder - you'll need to implement actual conversation tracking
      // For now, we'll show user activity as a proxy
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform profiles into conversation format
      const mockConversations: Conversation[] = profiles?.map(profile => ({
        id: profile.user_id,
        user_id: profile.user_id,
        user_email: profile.email,
        user_name: profile.full_name,
        message_count: 0, // Placeholder
        last_message_at: profile.created_at,
      })) || [];

      setConversations(mockConversations);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-black via-vice-purple/20 to-black border-2 border-vice-cyan/30 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-vice-cyan" />
            User Conversations
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            View all user interactions and conversations
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-vice-cyan" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No conversations found
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="p-4 bg-black/30 rounded-lg border border-vice-cyan/20 hover:border-vice-cyan/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-vice-purple to-vice-pink rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {conv.user_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {conv.user_email}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3 h-3 text-vice-cyan" />
                        <span className="text-xs text-gray-400">
                          Joined {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-vice-cyan/20 text-vice-cyan border-vice-cyan/30 shrink-0">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
