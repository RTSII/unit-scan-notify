import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Power, Plus } from "lucide-react";
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
    <div className="fixed inset-0 bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col overflow-hidden z-20">
      {/* Details Header */}
      <header className="bg-black/50 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="flex justify-center items-center h-20 px-4">
          <h1 className="text-xl font-semibold">Details</h1>
        </div>
      </header>

      {/* Details Content */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-md mx-auto space-y-4">
          
          {/* Date, Time & Unit Combined Row */}
          <div className="flex gap-3 items-end justify-center">
            <div className="w-20">
              <label className="block text-sm font-medium text-[var(--primary-color)] mb-1 text-center">Date</label>
              <Input
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder="MM/DD"
                className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base text-center"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-[var(--primary-color)] mb-1 text-center">Time</label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder="00:00 AM"
                className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-sm text-center"
              />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-[var(--primary-color)] mb-1 text-center">Unit</label>
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
                className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white h-12 text-base uppercase text-center font-semibold tracking-wider"
              />
            </div>
          </div>

          {/* Violation Types */}
          <div>
            <label className="block text-sm font-medium text-[var(--primary-color)] mb-3 text-center">Violation Type (Select applicable)</label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="items-outside"
                  checked={formData.violationTypes.itemsOutside}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, itemsOutside: !!checked }
                    }))
                  }
                  className="border-[var(--accent-color)] data-[state=checked]:bg-[var(--primary-color)]"
                />
                <label htmlFor="items-outside" className="text-white text-base cursor-pointer">
                  Items left outside Unit
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="trash-outside"
                  checked={formData.violationTypes.trashOutside}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      violationTypes: { ...prev.violationTypes, trashOutside: !!checked }
                    }))
                  }
                  className="border-[var(--accent-color)] data-[state=checked]:bg-[var(--primary-color)]"
                />
                <label htmlFor="trash-outside" className="text-white text-base cursor-pointer">
                  Trash left outside Unit
                </label>
              </div>
              <div className="flex items-center space-x-3">
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
                  className="border-[var(--accent-color)] data-[state=checked]:bg-[var(--primary-color)]"
                />
                <label htmlFor="balcony-items" className="text-white text-base cursor-pointer">
                  Items left on{' '}
                  {formData.violationTypes.balconyItems ? (
                    <span className="inline-flex gap-2 animate-pulse">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'balcony' }))}
                        className={`px-2 py-1 rounded transition-all duration-300 ${
                          formData.balconyChoice === 'balcony' 
                            ? 'bg-[var(--primary-color)] text-white scale-105 shadow-lg' 
                            : 'bg-transparent border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/20'
                        }`}
                      >
                        balcony
                      </button>
                      <span className="text-[var(--text-secondary)]">/</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'front' }))}
                        className={`px-2 py-1 rounded transition-all duration-300 ${
                          formData.balconyChoice === 'front' 
                            ? 'bg-[var(--primary-color)] text-white scale-105 shadow-lg' 
                            : 'bg-transparent border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/20'
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
          <div>
            <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="p-1 hover:bg-[var(--accent-color)]/20 rounded-full transition-colors flex items-center justify-center"
                >
                <Power 
                  size={14} 
                  className={`transition-colors duration-200 ${
                    isDescriptionExpanded ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
                  }`} 
                />
              </button>
              <label className="block text-sm font-medium text-[var(--color-neon-fuscia)] ml-1.5">Description</label>
            </div>
            {isDescriptionExpanded && (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter additional details..."
                className="bg-[var(--surface-color)] border-[var(--accent-color)] text-white text-base resize-none transition-all duration-300"
                rows={6}
              />
            )}
          </div>

          {/* Book Em Button */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={saveForm}
              className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus size={20} />
              <span>Book Em</span>
              {photoCount > 0 && (
                <span className="bg-white/20 rounded-full px-2 py-1 text-sm ml-2">
                  {photoCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetailsLive;