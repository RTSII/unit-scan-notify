import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Key, Copy } from 'lucide-react';

interface Conversation {
  id: string;
  phone_number: string;
  company_name: string | null;
  building_id: string | null;
  unit_number: string | null;
  roof_end: 'north' | 'south' | null;
  conversation_state: string;
  pin_delivered_at: string | null;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  message_type: 'incoming' | 'outgoing';
  message_content: string;
  created_at: string;
}

interface Building {
  id: string;
  building_name: string;
  building_code: string;
  access_instructions: string;
}

interface ActivePin {
  pin_code: string;
  valid_from: string;
  valid_until: string;
}

interface ConversationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}

export function ConversationDetailsDialog({ open, onOpenChange, conversationId }: ConversationDetailsDialogProps) {
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  const [pin, setPin] = useState<ActivePin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && conversationId) {
      fetchConversationDetails();
    }
  }, [open, conversationId]);

  const fetchConversationDetails = async () => {
    try {
      const { data: convData, error: convError } = await (supabase as any)
        .from('contractor_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      setConversation(convData as Conversation);

      const { data: messagesData, error: messagesError } = await (supabase as any)
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages((messagesData || []) as Message[]);

      if ((convData as any).building_id) {
        const { data: buildingData, error: buildingError } = await (supabase as any)
          .from('buildings')
          .select('*')
          .eq('id', (convData as any).building_id)
          .single();

        if (buildingError) throw buildingError;
        setBuilding(buildingData as Building);

        const { data: pinData, error: pinError } = await (supabase as any)
          .from('active_pins')
          .select('*')
          .eq('building_id', (convData as any).building_id)
          .gte('valid_until', new Date().toISOString().split('T')[0])
          .maybeSingle();

        if (!pinError && pinData) {
          setPin(pinData as ActivePin);
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversation details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch conversation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
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

  if (!conversation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-vice-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6 text-vice-cyan" />
            Conversation Details
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            View full conversation history and details
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-vice-cyan" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Contractor Information */}
            <div className="p-4 bg-black/40 border border-vice-cyan/30 rounded-lg">
              <h3 className="text-lg font-bold text-vice-pink mb-3">Contractor Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Company:</span>
                  <div className="text-white font-medium">{conversation.company_name || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Phone:</span>
                  <div className="text-white font-medium">{conversation.phone_number}</div>
                </div>
                <div>
                  <span className="text-gray-400">Started:</span>
                  <div className="text-white font-medium">{formatDate(conversation.created_at)}</div>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <Badge className="bg-vice-cyan/20 text-vice-cyan border-vice-cyan/30">
                    {conversation.conversation_state}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Building & PIN Information */}
            {building && (
              <div className="p-4 bg-black/40 border border-vice-purple/30 rounded-lg">
                <h3 className="text-lg font-bold text-vice-purple mb-3">Access Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-vice-cyan" />
                    <span className="text-white font-medium">{building.building_name}</span>
                  </div>
                  {conversation.unit_number && (
                    <div className="text-sm">
                      <span className="text-gray-400">Unit:</span>
                      <span className="text-white ml-2">
                        {conversation.unit_number} ({conversation.roof_end})
                      </span>
                    </div>
                  )}

                  {pin && (
                    <div className="mt-4 p-4 bg-vice-cyan/10 border border-vice-cyan/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-vice-cyan" />
                          <span className="text-vice-cyan font-bold">Active PIN</span>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(pin.pin_code)}
                          size="sm"
                          variant="ghost"
                          className="text-vice-cyan hover:bg-vice-cyan/20"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-4xl font-mono font-bold text-white tracking-widest text-center my-3">
                        {pin.pin_code}
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        Valid: {pin.valid_from} to {pin.valid_until}
                      </div>

                      <div className="mt-4 pt-4 border-t border-vice-cyan/20">
                        <div className="text-sm text-gray-300">
                          <div className="font-medium text-white mb-2">Access Instructions:</div>
                          {building.access_instructions}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conversation History */}
            <div className="p-4 bg-black/40 border border-vice-pink/30 rounded-lg">
              <h3 className="text-lg font-bold text-vice-pink mb-4">Conversation History</h3>
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.message_type === 'incoming'
                          ? 'bg-gray-800/50 ml-0 mr-12'
                          : 'bg-vice-cyan/10 ml-12 mr-0'
                      }`}
                    >
                      <div className="text-white text-sm whitespace-pre-wrap">
                        {message.message_content}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-vice-cyan/20 hover:bg-vice-cyan/30 text-vice-cyan border border-vice-cyan/30"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
