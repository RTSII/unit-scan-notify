import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Key } from 'lucide-react';

interface Building {
  id: string;
  building_name: string;
  building_code: string;
  north_end_units: string[];
  south_end_units: string[];
  access_instructions: string;
}

interface ActivePin {
  id: string;
  building_id: string;
  pin_code: string;
  valid_from: string;
  valid_until: string;
}

interface PinInput {
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  pin: string;
}

interface PinManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinManagementDialog({ open, onOpenChange }: PinManagementDialogProps) {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [pinInputs, setPinInputs] = useState<PinInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBuildingsAndPins();
    }
  }, [open]);

  const fetchBuildingsAndPins = async () => {
    try {
      const { data: buildingsData, error: buildingsError } = await (supabase as any)
        .from('buildings')
        .select('*')
        .order('building_code');

      if (buildingsError) throw buildingsError;

      const { data: pinsData, error: pinsError } = await (supabase as any)
        .from('active_pins')
        .select('*')
        .gte('valid_until', new Date().toISOString().split('T')[0]);

      if (pinsError) throw pinsError;

      setBuildings((buildingsData || []) as Building[]);

      const inputs: PinInput[] = ((buildingsData || []) as Building[]).map((building) => {
        const existingPin = (pinsData as any[] | null)?.find((pin: any) => pin.building_id === building.id);

        return {
          buildingId: building.id,
          buildingName: building.building_name,
          buildingCode: building.building_code,
          pin: existingPin?.pin_code || '',
        };
      });

      setPinInputs(inputs);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load buildings and PINs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePin = (index: number, field: keyof PinInput, value: string) => {
    const newInputs = [...pinInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setPinInputs(newInputs);
  };

  const validatePins = (): boolean => {
    for (const input of pinInputs) {
      // Only validate if a PIN is entered
      if (!input.pin) continue;
      
      // Sanitize and validate PIN
      const sanitizedPin = input.pin.trim();
      if (sanitizedPin.length !== 4 || !/^\d{4}$/.test(sanitizedPin)) {
        toast({
          title: "Validation Error",
          description: `${input.buildingName} must have a 4-digit PIN`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const savePins = async () => {
    if (!validatePins()) return;

    setSaving(true);
    try {
      // Calculate current month dates
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const validFrom = firstDayOfMonth.toISOString().split('T')[0];
      const validUntil = lastDayOfMonth.toISOString().split('T')[0];

      for (const input of pinInputs) {
        if (!input.pin) continue; // Skip if no PIN entered

        const sanitizedPin = input.pin.trim();

        const { data: existingPin } = await (supabase as any)
          .from('active_pins')
          .select('id')
          .eq('building_id', input.buildingId)
          .gte('valid_until', new Date().toISOString().split('T')[0])
          .maybeSingle();

        if (existingPin) {
          await (supabase as any)
            .from('active_pins')
            .update({
              pin_code: sanitizedPin,
              valid_from: validFrom,
              valid_until: validUntil,
            })
            .eq('id', (existingPin as any).id);
        } else {
          await (supabase as any)
            .from('active_pins')
            .insert({
              building_id: input.buildingId,
              pin_code: sanitizedPin,
              valid_from: validFrom,
              valid_until: validUntil,
            });
        }
      }

      toast({
        title: "Success",
        description: "PINs updated successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving PINs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save PINs",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-vice-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Key className="w-6 h-6 text-vice-cyan" />
            Update Monthly PINs
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Enter 4-digit PIN codes for each building. These PINs will be provided to contractors via SMS.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-vice-cyan" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {pinInputs.map((input, index) => (
              <div key={input.buildingId} className="p-6 bg-black/40 border border-vice-cyan/30 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-vice-pink">{input.buildingName}</h3>
                  <span className="text-vice-cyan font-mono text-sm">Code: {input.buildingCode}</span>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-full max-w-xs">
                    <Label className="text-white">4-Digit PIN</Label>
                    <Input
                      value={input.pin}
                      onChange={(e) => updatePin(index, 'pin', e.target.value.replace(/\D/g, ''))}
                      placeholder="0000"
                      maxLength={4}
                      className="bg-black/20 border-vice-cyan/30 text-white text-2xl text-center font-mono tracking-widest"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="border-vice-cyan/30 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={savePins}
                disabled={saving}
                className="bg-vice-cyan hover:bg-vice-cyan/80 text-black"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All PINs
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
