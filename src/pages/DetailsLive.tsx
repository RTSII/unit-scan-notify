import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Power, Plus, Home, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DetailsLive = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [formData, setFormData] = useState({
    date: '',
    unit: '',
    time: '',
    violationTypes: {
      itemsOutside: false,
      trashOutside: false,
      balconyItems: false
    },
    balconyChoice: '', // 'balcony' or 'front'
    description: ''
  });

  const saveForm = async () => {
    if (!user) return;

    // Validation: Check if Unit is filled and at least one violation is selected OR description is filled
    const hasViolations = Object.values(formData.violationTypes).some(violation => violation);
    const hasDescription = formData.description.trim().length > 0;
    
    if (!formData.unit.trim()) {
      toast.error('Unit number is required');
      return;
    }
    
    if (!hasViolations && !hasDescription) {
      toast.error('Please select at least one violation type or add a description');
      return;
    }

    // Get violation types as an array of selected options
    const selectedViolations = [];
    if (formData.violationTypes.itemsOutside) selectedViolations.push('Items left outside Unit');
    if (formData.violationTypes.trashOutside) selectedViolations.push('Trash left outside Unit');
    if (formData.violationTypes.balconyItems) {
      const location = formData.balconyChoice || 'balcony';
      selectedViolations.push(`Items left on ${location} railing`);
    }

    // Prepare photos array - include captured image if available
    const photos = capturedImage ? [capturedImage] : [];

    try {
      const { error } = await supabase
        .from('violation_forms')
        .insert({
          user_id: user.id,
          unit_number: formData.unit,
          date: formData.date,
          time: formData.time,
          location: selectedViolations.join(', '),
          description: formData.description,
          photos: photos,
          status: 'saved'
        });

      if (error) throw error;

      // Clear sessionStorage
      sessionStorage.removeItem('capturedImage');
      
      toast.success('Form saved successfully!');
      navigate('/books');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    }
  };

  // Count photos
  const photoCount = capturedImage ? 1 : 0;
  
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    setFormData(prev => ({
      ...prev,
      date: `${month}/${day}`,
      time: `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`
    }));

    // Get captured image from sessionStorage
    const storedImage = sessionStorage.getItem('capturedImage');
    if (storedImage) {
      setCapturedImage(storedImage);
    }
  }, []);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-cover bg-center bg-no-repeat flex flex-col overflow-hidden" style={{ backgroundImage: 'url(/2.jpeg)' }}>
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-vice-purple/30 to-black/70 z-0" />
      
      {/* Enhanced Details Header */}
      <header className="relative z-10 bg-gradient-to-r from-vice-purple/20 via-black/80 to-vice-blue/20 backdrop-blur-md border-b border-vice-pink/30 flex-shrink-0 shadow-lg">
        <div className="flex justify-between items-center h-16 px-4 safe-area-top">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-vice-cyan hover:text-vice-pink hover:bg-vice-purple/20 transition-all duration-300 flex items-center gap-2 group min-h-[44px] min-w-[44px]"
          >
            <Home size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Home</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-vice-pink animate-pulse" />
            <h1 className="text-lg font-bold text-white">Details</h1>
            <Zap size={16} className="text-vice-cyan animate-pulse" />
          </div>
          
          <div className="w-20" /> {/* Spacer for centered title */}
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="p-4 pb-24 max-w-sm mx-auto space-y-4">
          
          {/* Date, Time & Unit Combined Row */}
          <div className="flex gap-2 items-end justify-center">
            <div className="flex-1 max-w-[70px]">
              <label className="block text-xs font-medium text-vice-cyan mb-1 text-center">Date</label>
              <Input
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder="MM/DD"
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-10 text-center font-medium"
              />
            </div>
            <div className="flex-1 max-w-[80px]">
              <label className="block text-xs font-medium text-vice-cyan mb-1 text-center">Time</label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder="00:00 AM"
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-xs h-10 text-center font-medium"
              />
            </div>
            <div className="flex-1 max-w-[70px]">
              <label className="block text-xs font-medium text-vice-cyan mb-1 text-center">Unit</label>
              <Input
                value={formData.unit}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase();
                  // Force 1st and 3rd characters to be uppercase letters if they exist
                  if (value.length >= 1) value = value.charAt(0).toUpperCase() + value.slice(1);
                  if (value.length >= 3) value = value.slice(0, 2) + value.charAt(2).toUpperCase() + value.slice(3);
                  setFormData(prev => ({ ...prev, unit: value }));
                }}
                maxLength={3}
                className="bg-black/40 border-vice-cyan/30 text-white h-10 text-sm uppercase text-center font-bold tracking-wider"
              />
            </div>
          </div>

          {/* Violation Types */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-vice-cyan text-center">Violation Type (Select applicable)</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/30 min-h-[44px]">
                <Checkbox
                  id="items-outside"
                  checked={formData.violationTypes.itemsOutside}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, itemsOutside: !!checked }
                    }))
                  }
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-h-[20px] min-w-[20px]"
                />
                <label htmlFor="items-outside" className="text-white text-sm cursor-pointer flex-1 leading-tight">
                  Items left outside Unit
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/30 min-h-[44px]">
                <Checkbox
                  id="trash-outside"
                  checked={formData.violationTypes.trashOutside}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, trashOutside: !!checked }
                    }))
                  }
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-h-[20px] min-w-[20px]"
                />
                <label htmlFor="trash-outside" className="text-white text-sm cursor-pointer flex-1 leading-tight">
                  Trash left outside Unit
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/30 min-h-[44px]">
                <Checkbox
                  id="balcony-items"
                  checked={formData.violationTypes.balconyItems}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, balconyItems: !!checked },
                      balconyChoice: checked ? '' : ''
                    }))
                  }
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-h-[20px] min-w-[20px]"
                />
                <label htmlFor="balcony-items" className="text-white text-sm cursor-pointer flex-1 leading-tight">
                  Items left on{' '}
                  {formData.violationTypes.balconyItems ? (
                    <span className="inline-flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'balcony' }))}
                        className={`px-3 py-1 rounded transition-all duration-300 min-h-[32px] text-xs font-medium ${
                          formData.balconyChoice === 'balcony' 
                            ? 'bg-vice-pink text-white scale-105 shadow-lg' 
                            : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                        }`}
                      >
                        balcony
                      </button>
                      <span className="text-vice-cyan/60 self-center">/</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'front' }))}
                        className={`px-3 py-1 rounded transition-all duration-300 min-h-[32px] text-xs font-medium ${
                          formData.balconyChoice === 'front' 
                            ? 'bg-vice-pink text-white scale-105 shadow-lg' 
                            : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                        }`}
                      >
                        front
                      </button>
                    </span>
                  ) : (
                    'balcony/front'
                  )}{' '}
                  railing
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="p-2 hover:bg-black/20 rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Power 
                  size={16} 
                  className={`transition-colors duration-200 ${
                    isDescriptionExpanded ? 'text-vice-cyan' : 'text-vice-pink'
                  }`} 
                />
              </button>
              <label className="block text-sm font-medium text-vice-pink">Description</label>
            </div>
            {isDescriptionExpanded && (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter additional details..."
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm resize-none transition-all duration-300 min-h-[80px]"
                rows={4}
              />
            )}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm border-t border-vice-cyan/20 flex-shrink-0">
        <div className="p-4 pb-6 safe-area-bottom">
          <div className="flex justify-center">
            <Button 
              onClick={saveForm}
              disabled={!formData.unit.trim() || (!Object.values(formData.violationTypes).some(v => v) && !formData.description.trim())}
              className="bg-gradient-to-r from-vice-purple to-vice-blue hover:from-vice-pink hover:to-vice-purple text-white px-8 py-4 text-base font-bold rounded-lg flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[56px] min-w-[140px]"
            >
              <Plus size={20} />
              <span>Book Em</span>
              {photoCount > 0 && (
                <span className="bg-white/20 rounded-full px-2 py-1 text-sm ml-1">
                  {photoCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsLive;