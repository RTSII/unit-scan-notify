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
    <div className="fixed inset-0 bg-gradient-to-br from-vice-purple via-black to-vice-blue text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-3 sm:p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20 flex-shrink-0 relative">
        <h1 className="text-lg sm:text-xl font-bold">Details</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/10 p-2 absolute right-3 sm:right-4"
          onClick={() => navigate('/')}
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-4 max-w-md mx-auto pb-24">
          {/* Date, Time, Unit Fields */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1.5">
              <label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Date</label>
              <Input
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Time</label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Unit</label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-9 sm:h-10"
              />
            </div>
          </div>

          {/* Violation Type Section - Compact */}
          <div className="space-y-3">
            <h3 className="text-vice-cyan font-medium text-sm sm:text-base text-center">Violation Type (Select applicable)</h3>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                <Checkbox
                  checked={formData.violationTypes.itemsOutside}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, itemsOutside: !!checked }
                    }))
                  }
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Items left outside Unit</label>
              </div>

              <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                <Checkbox
                  checked={formData.violationTypes.trashOutside}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, trashOutside: !!checked }
                    }))
                  }
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Trash left outside Unit</label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                  <Checkbox
                    checked={formData.violationTypes.balconyItems}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        violationTypes: { ...prev.violationTypes, balconyItems: !!checked },
                        balconyChoice: checked ? '' : ''
                      }))
                    }
                    className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                  />
                  <label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Items left on balcony/front railing</label>
                </div>
                
                {formData.violationTypes.balconyItems && (
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'balcony' }))}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        formData.balconyChoice === 'balcony' 
                          ? 'bg-vice-pink text-white' 
                          : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                      }`}
                    >
                      balcony
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'front' }))}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        formData.balconyChoice === 'front' 
                          ? 'bg-vice-pink text-white' 
                          : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                      }`}
                    >
                      front
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section - Collapsible */}
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between cursor-pointer p-1"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
                <label className="text-vice-pink font-medium text-sm">Description</label>
              </div>
              <Power className={`w-4 h-4 transition-colors ${isDescriptionExpanded ? 'text-vice-cyan' : 'text-vice-pink'}`} />
            </div>
            {isDescriptionExpanded && (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter additional details..."
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 min-h-[80px] sm:min-h-[100px] resize-none text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-vice-cyan/20 p-4">
        <div className="flex justify-center">
          <Button 
            onClick={saveForm}
            disabled={!formData.unit.trim() || (!Object.values(formData.violationTypes).some(v => v) && !formData.description.trim())}
            className="bg-vice-pink hover:bg-vice-pink/80 text-white px-8 py-3 rounded-lg font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Em
            {photoCount > 0 && (
              <span className="bg-white/20 rounded-full px-2 py-1 text-xs ml-1">
                {photoCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailsLive;