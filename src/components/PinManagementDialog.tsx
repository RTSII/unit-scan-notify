import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Key } from 'lucide-react';

interface PinManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinManagementDialog({ open, onOpenChange }: PinManagementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const { toast } = useToast();

  const handleUpdatePin = async () => {
    if (!userEmail || !newPin) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and PIN",
        variant: "destructive",
      });
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement PIN storage - requires database migration to add 'pin' column to profiles table
      // For now, this is a placeholder that demonstrates the UI
      
      toast({
        title: "Feature Coming Soon",
        description: "PIN management requires database migration. Please contact administrator.",
      });

      setUserEmail('');
      setNewPin('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-black via-vice-purple/20 to-black border-2 border-vice-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-vice-cyan" />
            Update User PIN
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Update the 4-digit PIN for a user account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="userEmail" className="text-white">User Email</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="bg-black/30 border-vice-cyan/30 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPin" className="text-white">New PIN (4 digits)</Label>
            <Input
              id="newPin"
              type="text"
              maxLength={4}
              placeholder="1234"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="bg-black/30 border-vice-cyan/30 text-white"
            />
          </div>

          <Button
            onClick={handleUpdatePin}
            disabled={loading}
            className="w-full bg-vice-cyan hover:bg-vice-cyan/80 text-black"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update PIN
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
