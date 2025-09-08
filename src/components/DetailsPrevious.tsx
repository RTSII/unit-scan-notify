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
    // Always show at least one card, plus additional cards for selected images
    const totalSlots = Math.min(4, Math.max(1, selectedImages.length + 1));

    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: totalSlots }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-black/40 border border-vice-cyan/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors min-h-[44px] relative"
            onClick={index === selectedImages.length ? handleImageSelection : undefined}
          >
            {index < selectedImages.length ? (
              <img
                src={selectedImages[index]}
                alt={`Evidence ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <>
                <Plus className="w-8 h-8 text-vice-cyan" />
                {index === 0 && (
                  <span className="absolute bottom-1 text-vice-cyan/70 text-xs">Add Photo</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-vice-purple via-black to-vice-blue flex flex-col">
      {/* Header */}
      <div className="relative p-4 border-b border-vice-cyan/20">
        <h1 className="text-white text-xl font-bold text-center">Details</h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 absolute right-4 top-1/2 transform -translate-y-1/2"
          onClick={() => navigate('/')}
        >
          <Home className="w-6 h-6" />
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
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center w-20 mx-auto"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-vice-cyan font-medium text-sm text-center block">Time</Label>
              <div className="flex gap-1 justify-center">
                <Input
                  value={formData.time}
                  onChange={handleTimeChange}
                  placeholder="HH:MM"
                  maxLength={5}
                  className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 flex-1 text-center min-w-[80px]"
                />
                <select
                  value={formData.ampm}
                  onChange={(e) => setFormData(prev => ({ ...prev, ampm: e.target.value }))}
                  className="bg-black/40 border border-vice-cyan/30 text-white text-base h-11 px-2 rounded-md min-w-[60px]"
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
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center w-16 mx-auto"
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
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${formData.itemsTrashChoice === 'items'
                        ? 'bg-vice-pink text-white'
                        : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                        }`}
                    >
                      items
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, itemsTrashChoice: 'trash' }))}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${formData.itemsTrashChoice === 'trash'
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
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${formData.balconyChoice === 'balcony'
                        ? 'bg-vice-pink text-white'
                        : 'bg-transparent border border-vice-pink text-vice-pink hover:bg-vice-pink/20'
                        }`}
                    >
                      balcony
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, balconyChoice: 'front' }))}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${formData.balconyChoice === 'front'
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

          {/* Morphing Description and Photos Buttons - Combined Row */}
          <div className="flex gap-3 justify-center">
            {/* Description Button */}
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ease-in-out min-h-[44px] min-w-[120px] transform-gpu ${isDescriptionExpanded
                ? 'bg-vice-pink text-white shadow-lg shadow-vice-pink/30 scale-105'
                : 'bg-black/40 border border-vice-cyan/30 text-vice-cyan hover:bg-vice-pink/20 hover:shadow-md hover:shadow-vice-pink/20'
                }`}
              onClick={() => {
                setIsDescriptionExpanded(!isDescriptionExpanded);
                // Close photos when opening description for exclusive expansion
                if (!isDescriptionExpanded) setIsPhotosExpanded(false);
              }}
              aria-expanded={isDescriptionExpanded}
              aria-label={isDescriptionExpanded ? "Collapse description section" : "Expand description section"}
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span className="font-medium text-sm">Description</span>
              {isDescriptionExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              )}
            </button>

            {/* Photos Button */}
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ease-in-out min-h-[44px] min-w-[120px] transform-gpu ${isPhotosExpanded
                ? 'bg-vice-pink text-white shadow-lg shadow-vice-pink/30 scale-105'
                : 'bg-black/40 border border-vice-cyan/30 text-vice-cyan hover:bg-vice-pink/20 hover:shadow-md hover:shadow-vice-pink/20'
                }`}
              onClick={() => {
                setIsPhotosExpanded(!isPhotosExpanded);
                // Close description when opening photos for exclusive expansion
                if (!isPhotosExpanded) setIsDescriptionExpanded(false);
              }}
              aria-expanded={isPhotosExpanded}
              aria-label={isPhotosExpanded ? "Collapse photos section" : "Expand photos section"}
            >
              <Camera className="w-4 h-4" />
              <span className="font-medium text-sm">
                Photos ({selectedImages.length})
              </span>
              {isPhotosExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              )}
            </button>
          </div>

          {/* Expanded Description Content with enhanced animation */}
          {isDescriptionExpanded && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-300 fade-in">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter additional details..."
                className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 min-h-[100px] resize-none transition-all duration-300"
              />
            </div>
          )}

          {/* Expanded Photos Content with enhanced animation */}
          {isPhotosExpanded && (
            <div className="mt-3 animate-in slide-in-from-top-2 duration-300 fade-in">
              {renderPhotoGrid()}
            </div>
          )}
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