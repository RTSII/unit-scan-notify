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
import { Loader2, Home, Camera, Download, FileText, ChevronDown, ChevronUp, Plus, ArrowLeft } from "lucide-react";

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

    // Basic validation
    if (!formData.unit || !formData.date) {
      toast.error("Please fill in required fields (Unit and Date)");
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
        violation_types: violationTypesArray,
        photos: selectedImages, // For now, storing as blob URLs - in production you'd upload to storage
        status: 'completed',
        location: '', // Add if needed
        created_at: new Date().toISOString()
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
          onClick={() => window.location.href = '/'}
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-md mx-auto pb-20">
          {/* Date, Time, Unit Fields */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1.5">
              <Label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Date</Label>
              <Input
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Time</Label>
              <Input
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder=""
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Unit</Label>
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
                  onCheckedChange={(checked) => handleViolationTypeChange('itemsOutside', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <Label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Items left outside Unit</Label>
              </div>

              <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                <Checkbox
                  checked={formData.violationTypes.trashOutside}
                  onCheckedChange={(checked) => handleViolationTypeChange('trashOutside', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <Label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Trash left outside Unit</Label>
              </div>

              <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                <Checkbox
                  checked={formData.violationTypes.itemsBalcony}
                  onCheckedChange={(checked) => handleViolationTypeChange('itemsBalcony', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                />
                <Label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Items left on balcony/front railing</Label>
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
                <Label className="text-vice-pink font-medium text-sm">Description</Label>
              </div>
              {isDescriptionExpanded ? (
                <ChevronUp className="w-4 h-4 text-vice-pink" />
              ) : (
                <ChevronDown className="w-4 h-4 text-vice-pink" />
              )}
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

          {/* Photo Evidence Section - Collapsible */}
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between cursor-pointer p-1"
              onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
                <Label className="text-vice-pink font-medium text-sm">Photo Evidence</Label>
              </div>
              {isPhotosExpanded ? (
                <ChevronUp className="w-4 h-4 text-vice-pink" />
              ) : (
                <ChevronDown className="w-4 h-4 text-vice-pink" />
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

          {/* Book Em Save Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleSaveForm}
              disabled={isSaving}
              className="bg-vice-pink hover:bg-vice-pink/80 text-white px-8 py-3 rounded-lg font-semibold text-sm"
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

      {/* Fixed Bottom Navigation */}
      <div className="bg-black/90 border-t border-vice-cyan/20 p-3 sm:p-4 flex-shrink-0">
        <div className="flex justify-around max-w-md mx-auto">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 text-vice-cyan p-2">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs">Capture</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 text-vice-pink p-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs">Details</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 text-vice-cyan p-2">
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailsPrevious;