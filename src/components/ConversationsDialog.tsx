import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare, Search, Clock, CheckCircle, Eye } from 'lucide-react';
import { ConversationDetailsDialog } from './ConversationDetailsDialog';

interface Conversation {
  id: string;
  phone_number: string;
  company_name: string | null;
  building_id: string | null;
  unit_number: string | null;
  roof_end: 'north' | 'south' | null;
  conversation_state: 'initial' | 'awaiting_info' | 'confirming' | 'pin_delivered' | 'completed';
  pin_delivered_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationsDialog({ open, onOpenChange }: ConversationsDialogProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('contractor_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setConversations((data || []) as Conversation[]);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'initial':
        return 'Started';
      case 'awaiting_info':
        return 'Awaiting Info';
      case 'confirming':
        return 'Confirming';
      case 'pin_delivered':
        return 'PIN Delivered';
      case 'completed':
        return 'Completed';
      default:
        return state;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pin_delivered':
        return 'bg-vice-purple/20 text-vice-purple border-vice-purple/30';
      case 'confirming':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.phone_number.includes(searchLower) ||
      conv.company_name?.toLowerCase().includes(searchLower) ||
      conv.unit_number?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setDetailsOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-black/95 border-vice-cyan/30 flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-vice-cyan" />
              Contractor Conversations
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {conversations.length} total conversations
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-vice-cyan" />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vice-cyan/80" />
                  <Input
                    placeholder="Search by phone, company, or unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/40 border-vice-cyan/30 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-4 bg-black/40 border border-vice-cyan/30 rounded-lg hover:bg-black/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {conv.company_name || 'Unknown Company'}
                            </span>
                            <Badge variant="secondary" className={getStateColor(conv.conversation_state)}>
                              {getStateLabel(conv.conversation_state)}
                            </Badge>
                            {conv.conversation_state === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>

                          <div className="text-sm text-gray-400">
                            {conv.phone_number}
                          </div>

                          {conv.unit_number && (
                            <div className="text-sm text-vice-cyan">
                              Unit: {conv.unit_number} ({conv.roof_end})
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(conv.created_at)}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewDetails(conv.id)}
                          size="sm"
                          className="bg-vice-cyan/20 hover:bg-vice-cyan/30 text-vice-cyan border border-vice-cyan/30"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedConversationId && (
        <ConversationDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          conversationId={selectedConversationId}
        />
      )}
    </>
  );
}
