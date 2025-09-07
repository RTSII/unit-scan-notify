import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const { user } = useAuth();
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
      itemsTrashOutside: false,
      balconyItems: false,
      parkingLotItems: false,
    },
    itemsTrashChoice: '', // 'items' or 'trash'
    balconyChoice: '', // 'balcony' or 'front'
    ampm: 'AM'
  });

  // Keep fields blank for details-previous (no auto-completion)
  useEffect(() => {
    setFormData({
      date: '',
      time: '',
      unit: '',
      description: '',
      violationTypes: {
        itemsTrashOutside: false,
        balconyItems: false,
        parkingLotItems: false,
      },
      itemsTrashChoice: '',
      balconyChoice: '',
      ampm: 'AM'
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

  const formatDateInput = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Add slash after 2 digits (MM/DD format)
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
  };

  const formatTimeInput = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Add colon after 2 digits (HH:MM format)
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + ':' + numbers.slice(2, 4);
    }
    return numbers;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setFormData(prev => ({ ...prev, date: formatted }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setFormData(prev => ({ ...prev, time: formatted }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uppercased = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, unit: uppercased }));
  };

  const handleImageSelection = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageUrls: string[] = [];
      let processedCount = 0;
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImageUrls.push(e.target.result as string);
            processedCount++;
            if (processedCount === files.length) {
              setSelectedImages(prev => [...prev, ...newImageUrls]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSaveForm = async () => {
    console.log('Save form clicked');
    
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
      console.log('Starting save process...');

      // Get violation types as array
      const violationTypesArray = [];
      if (formData.violationTypes.itemsTrashOutside) {
        const choice = formData.itemsTrashChoice || 'items';
        violationTypesArray.push(`${choice === 'items' ? 'Items' : 'Trash'} left outside Unit`);
      }
      if (formData.violationTypes.balconyItems) {
        const location = formData.balconyChoice || 'balcony';
        violationTypesArray.push(`Items left on ${location} railing`);
      }
      if (formData.violationTypes.parkingLotItems) {
        violationTypesArray.push('Items left in Parking lot');
      }

      // Format time with AM/PM
      const timeWithAmPm = formData.time ? `${formData.time} ${formData.ampm}` : '';

      // Create form data for database
      const formToSave = {
        user_id: user.id,
        unit_number: formData.unit,
        date: formData.date,
        time: timeWithAmPm,
        description: formData.description || '',
        location: violationTypesArray.join(', '), // Store violation types in location field
        photos: selectedImages, // Store base64 images
        status: 'completed'
      };

      console.log('Saving form data:', formToSave);

      const { data, error } = await supabase
        .from('violation_forms')
        .insert([formToSave])
        .select();

      if (error) {
        console.error('Save error:', error);
        toast.error(`Failed to save form: ${error.message}`);
        return;
      }

      console.log('Form saved successfully:', data);
      toast.success("Violation saved successfully!");

      // Reset form
      setFormData({
        date: '',
        time: '',
        unit: '',
        description: '',
        violationTypes: {
          itemsTrashOutside: false,
          balconyItems: false,
          parkingLotItems: false,
        },
        itemsTrashChoice: '',
        balconyChoice: '',
        ampm: 'AM'
      });
      setSelectedImages([]);
      setIsDescriptionExpanded(false);
      setIsPhotosExpanded(false);

      // Navigate to books page
      navigate('/books');

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate if form is valid for save button
  const isFormValid = () => {
    const hasRequiredFields = formData.unit && formData.date;
    const hasViolationType = Object.values(formData.violationTypes).some(checked => checked);
    const hasDescription = formData.description.trim().length > 0;
    return hasRequiredFields && (hasViolationType || hasDescription);
  };

  // Photo display logic
  const renderPhotoGrid = () => {
    const displayImages = selectedImages.slice(0, 3);
    const additionalCount = Math.max(0, selectedImages.length - 3);

    return (
      <div className="grid grid-cols-2 gap-2">
        {/* First image or add button */}
        <div 
          className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors min-h-[44px]"
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
        <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center min-h-[44px]">
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
        <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center min-h-[44px]">
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
        <div className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center min-h-[44px]">
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

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-vice-purple via-black to-vice-blue flex flex-col">
      {/* Header */}
      <div className="relative p-4 border-b border-vice-cyan/20">
        <h1 className="text-white text-xl font-bold text-center">Details Previous</h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 absolute right-4"
          onClick={() => navigate('/')}
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
          {/* Date, Time, Unit Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium text-sm text-center block">Date</Label>
              <Input
                value={formData.date}
                onChange={handleDateChange}
                placeholder="MM/DD"
                maxLength={5}
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium text-sm text-center block">Time</Label>
              <div className="flex gap-1">
                <Input
                  value={formData.time}
                  onChange={handleTimeChange}
                  placeholder="HH:MM"
                  maxLength={5}
                  className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 flex-1"
                />
                <select
                  value={formData.ampm}
                  onChange={(e) => setFormData(prev => ({ ...prev, ampm: e.target.value }))}
                  className="bg-black/40 border border-vice-cyan/30 text-white text-base h-11 px-2 rounded-md"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium text-sm text-center block">Unit</Label>
              <Input
                value={formData.unit}
                onChange={handleUnitChange}
                placeholder="Unit #"
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11"
              />
            </div>
          </div>

          {/* Violation Type Section */}
          <div className="space-y-4">
            <h3 className="text-vice-cyan font-medium text-base text-center">Violation Type (Select applicable)</h3>
            
            <div className="space-y-3">
              {/* Combined Items/Trash left outside Unit */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20 min-h-[44px]">
                  <Checkbox
                    checked={formData.violationTypes.itemsTrashOutside}
                    onCheckedChange={(checked) => {
                      handleViolationTypeChange('itemsTrashOutside', checked as boolean);
                      if (!checked) setFormData(prev => ({ ...prev, itemsTrashChoice: '' }));
                    }}
                    className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-w-[20px] min-h-[20px]"
                  />
                  <Label className="text-white cursor-pointer text-sm leading-tight flex-1">Items/Trash left outside Unit</Label>
                </div>
                
                {formData.violationTypes.itemsTrashOutside && (
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, itemsTrashChoice: 'items' }))}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        formData.itemsTrashChoice === 'items' 
                          ? 'bg-vice-pink text-white' 
                          : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                      }`}
                    >
                      items
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, itemsTrashChoice: 'trash' }))}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        formData.itemsTrashChoice === 'trash' 
                          ? 'bg-vice-pink text-white' 
                          : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                      }`}
                    >
                      trash
                    </button>
                  </div>
                )}
              </div>

              {/* Balcony/Front railing items */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20 min-h-[44px]">
                  <Checkbox
                    checked={formData.violationTypes.balconyItems}
                    onCheckedChange={(checked) => {
                      handleViolationTypeChange('balconyItems', checked as boolean);
                      if (!checked) setFormData(prev => ({ ...prev, balconyChoice: '' }));
                    }}
                    className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-w-[20px] min-h-[20px]"
                  />
                  <Label className="text-white cursor-pointer text-sm leading-tight flex-1">Items left on balcony/front railing</Label>
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

              {/* New Parking lot items */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-vice-cyan/20 bg-black/20 min-h-[44px]">
                <Checkbox
                  checked={formData.violationTypes.parkingLotItems}
                  onCheckedChange={(checked) => handleViolationTypeChange('parkingLotItems', checked as boolean)}
                  className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink min-w-[20px] min-h-[20px]"
                />
                <Label className="text-white cursor-pointer text-sm leading-tight flex-1">Items left in Parking lot</Label>
              </div>
            </div>
          </div>

          {/* Description Section - Collapsible */}
          <div className="space-y-3">
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
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 min-h-[100px] resize-none"
              />
            )}
          </div>

          {/* Photos Section - Collapsible */}
          <div className="space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer p-2 min-h-[44px]"
              onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-vice-pink"></div>
                <Label className="text-vice-pink font-medium text-sm">
                  Photos ({selectedImages.length})
                </Label>
              </div>
              {isPhotosExpanded ? (
                <ChevronUp className="w-5 h-5 text-vice-pink" />
              ) : (
                <ChevronDown className="w-5 h-5 text-vice-pink" />
              )}
            </div>
            {isPhotosExpanded && renderPhotoGrid()}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Save Button */}
      <div className="p-4 border-t border-vice-cyan/20 bg-black/20">
        <Button
          onClick={handleSaveForm}
          disabled={isSaving || !isFormValid()}
          className="bg-vice-pink hover:bg-vice-pink/80 text-white font-semibold text-base px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center gap-2 min-h-[48px] mx-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Book Em
              {selectedImages.length > 0 && (
                <span className="bg-white/20 rounded-full px-2 py-1 text-xs ml-1">
                  {selectedImages.length}
                </span>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default DetailsPrevious;