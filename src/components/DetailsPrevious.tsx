import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Home, ChevronDown, ChevronUp, Plus, Camera } from "lucide-react";

const DetailsPrevious = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    unit: '',
    description: '',
    violationTypes: {
      itemsOutside: false,
      trashOutside: false,
      itemsBalcony: false,
    }
  });

  // Keep fields blank for details-previous (no auto-completion)
  useEffect(() => {
    setFormData({
      date: '',
      time: '',
      unit: '',
      description: '',
      violationTypes: {
        itemsOutside: false,
        trashOutside: false,
        itemsBalcony: false,
      }
    });
  }, []);

  const handleViolationTypeChange = (type: keyof typeof formData.violationTypes, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      violationTypes: {
        ...prev.violationTypes,
        [type]: checked
      }
    }));
  };

  const handleImageSelection = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageUrls: string[] = [];
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        newImageUrls.push(url);
      });
      setSelectedImages(prev => [...prev, ...newImageUrls]);
    }
  };

  const handleSaveForm = async () => {
    if (!user?.id) {
      toast.error("Authentication required");
      return;
    }

    // Updated validation: Date, Unit, and at least one violation type OR description
    if (!formData.unit || !formData.date) {
      toast.error("Please fill in required fields (Unit and Date)");
      return;
    }

    const hasViolationType = Object.values(formData.violationTypes).some(checked => checked);
    const hasDescription = formData.description.trim().length > 0;
    
    if (!hasViolationType && !hasDescription) {
      toast.error("Please select at least one violation type or enter a description");
      return;
    }

    setIsSaving(true);
    
    try {
      // Get violation types as array
      const violationTypesArray = Object.entries(formData.violationTypes)
        .filter(([_, checked]) => checked)
        .map(([type, _]) => type);

      // Create form data for database
      const formToSave = {
        user_id: user.id,
        unit_number: formData.unit,
        date: formData.date,
        time: formData.time || '',
        description: formData.description || '',
        location: violationTypesArray.join(', '), // Store violation types in location field
        photos: selectedImages, // For now, storing as blob URLs - in production you'd upload to storage
        status: 'completed'
      };

      const { error } = await supabase
        .from('violation_forms')
        .insert([formToSave]);

      if (error) {
        console.error('Save error:', error);
        toast.error("Failed to save form");
        return;
      }

      toast.success("Form saved successfully!");
      navigate('/books');
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  const renderImageGrid = () => {
    // If no images or only one image, show single add button
    if (selectedImages.length <= 1) {
      return (
        <div className="flex justify-center">
          <div 
            className="aspect-square w-24 bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
            onClick={handleImageSelection}
          >
            {selectedImages[0] ? (
              <img 
                src={selectedImages[0]} 
                alt="Evidence" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Plus className="w-5 h-5 text-white/60" />
            )}
          </div>
        </div>
      );
    }

    // For multiple images, show 2x2 grid
    const displayImages = selectedImages.slice(0, 3);
    const additionalCount = selectedImages.length - 3;

    return (
      <div className="grid grid-cols-2 gap-2">
        {/* First image or add button */}
        <div 
          className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
          onClick={handleImageSelection}
        >
          {displayImages[0] ? (
            <img 
              src={displayImages[0]} 
              alt="Evidence 1" 
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Plus className="w-5 h-5 text-white/60" />
          )}
        </div>

        {/* Second image slot */}
        <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center">
          {displayImages[1] ? (
            <img 
              src={displayImages[1]} 
              alt="Evidence 2" 
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Camera className="w-5 h-5 text-white/40" />
          )}
        </div>

        {/* Third image slot */}
        <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center">
          {displayImages[2] ? (
            <img 
              src={displayImages[2]} 
              alt="Evidence 3" 
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Camera className="w-5 h-5 text-white/40" />
          )}
        </div>

        {/* Additional count or fourth slot */}
        <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center">
          {additionalCount > 0 ? (
            <div className="text-center">
              <span className="text-vice-cyan font-medium text-sm">+{additionalCount}</span>
              <div className="text-white/60 text-xs">more</div>
            </div>
          ) : (
            <Camera className="w-5 h-5 text-white/40" />
          )}
        </div>
      </div>
    );
  };

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
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

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 space-y-4 max-w-md mx-auto pb-24">
          {/* Date, Time, Unit Fields */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1.5">
              <Label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Date</Label>
              <Input
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Time</Label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Unit</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 sm:h-10"
              />
            </div>
          </div>

          {/* Violation Type Section - Compact */}
          <div className="space-y-3">
            <h3 className="text-vice-cyan font-medium text-sm sm:text-base text-center">Violation Type (Select applicable)</h3>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20 min-h-[44px]">
                <Checkbox
                  checked={formData.violationTypes.itemsOutside}
                  onCheckedChange={(checked) => handleViolationTypeChange('itemsOutside', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-w-[20px] min-h-[20px]"
                />
                <Label className="text-white cursor-pointer text-sm sm:text-sm leading-tight flex-1">Items left outside Unit</Label>
              </div>

              <div className="flex items-center space-x-3 p-3 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20 min-h-[44px]">
                <Checkbox
                  checked={formData.violationTypes.trashOutside}
                  onCheckedChange={(checked) => handleViolationTypeChange('trashOutside', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-w-[20px] min-h-[20px]"
                />
                <Label className="text-white cursor-pointer text-sm sm:text-sm leading-tight flex-1">Trash left outside Unit</Label>
              </div>

              <div className="flex items-center space-x-3 p-3 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20 min-h-[44px]">
                <Checkbox
                  checked={formData.violationTypes.itemsBalcony}
                  onCheckedChange={(checked) => handleViolationTypeChange('itemsBalcony', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-w-[20px] min-h-[20px]"
                />
                <Label className="text-white cursor-pointer text-sm sm:text-sm leading-tight flex-1">Items left on balcony/front railing</Label>
              </div>
            </div>
          </div>

          {/* Description Section - Collapsible */}
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between cursor-pointer p-2 min-h-[44px]"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
                <Label className="text-vice-pink font-medium text-sm">Description</Label>
              </div>
              {isDescriptionExpanded ? (
                <ChevronUp className="w-5 h-5 text-vice-pink" />
              ) : (
                <ChevronDown className="w-5 h-5 text-vice-pink" />
              )}
            </div>
            {isDescriptionExpanded && (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter additional details..."
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 min-h-[100px] resize-none text-base"
              />
            )}
          </div>

          {/* Photo Evidence Section - Collapsible */}
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between cursor-pointer p-2 min-h-[44px]"
              onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
                <Label className="text-vice-pink font-medium text-sm">Photo Evidence</Label>
              </div>
              {isPhotosExpanded ? (
                <ChevronUp className="w-5 h-5 text-vice-pink" />
              ) : (
                <ChevronDown className="w-5 h-5 text-vice-pink" />
              )}
            </div>
            {isPhotosExpanded && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                {renderImageGrid()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-vice-cyan/20 p-4 pb-safe-bottom">
        <div className="flex justify-center">
          <Button 
            onClick={handleSaveForm}
            disabled={isSaving || !formData.unit.trim() || (!Object.values(formData.violationTypes).some(v => v) && !formData.description.trim())}
            className="bg-vice-pink hover:bg-vice-pink/80 text-white px-8 py-3 rounded-lg font-semibold text-base min-h-[44px] min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Book Em"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailsPrevious;