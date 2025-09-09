import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Camera, Plus, Loader2, X, Home } from "lucide-react";
import {
  TextureCard,
  TextureCardContent,
} from "@/components/ui/texture-card";
import { PostgrestError } from '@supabase/supabase-js';

interface ViolationFormData {
  id?: string;
  date: string;
  unit: string;
  time: string;
  ampm: string;
  violationTypes: {
    itemsTrashOutside: boolean;
    balconyItems: boolean;
    parkingLotItems: boolean;
  };
  itemsTrashChoice: string;
  balconyChoice: string;
  description: string;
}

const DetailsPrevious = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ViolationFormData>({
    date: '',
    unit: '',
    time: '',
    ampm: 'AM',
    violationTypes: {
      itemsTrashOutside: false,
      balconyItems: false,
      parkingLotItems: false,
    },
    itemsTrashChoice: '',
    balconyChoice: '',
    description: '',
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPhotosExpanded, setIsPhotosExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  // Format time input to ensure MM:HH format
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    
    if (value.length >= 3) {
      const hours = value.slice(0, 2);
      const minutes = value.slice(2, 4);
      value = `${hours}:${minutes}`;
    } else if (value.length >= 2) {
      const hours = value.slice(0, 2);
      value = hours;
    }
    
    setFormData(prev => ({ ...prev, time: value }));
  };

  // Auto-capitalize unit input
  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, unit: value }));
  };

  const handleViolationTypeChange = (type: keyof typeof formData.violationTypes, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      violationTypes: {
        ...prev.violationTypes,
        [type]: checked
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            processedCount++;
            
            if (processedCount === files.length) {
              setSelectedImages(prev => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const renderPhotoGrid = () => {
    const allImages = [...existingPhotos, ...selectedImages];
    
    if (allImages.length === 0) {
      return (
        <div className="text-center py-8 text-vice-cyan/60">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No photos added yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2">
        {allImages.map((image, index) => (
          <div key={index} className="relative group aspect-square">
            <img 
              src={image} 
              alt={`Violation ${index + 1}`} 
              className="w-full h-full object-cover rounded-lg border border-vice-cyan/20"
            />
            <button
              type="button"
              onClick={() => removeImage(index - existingPhotos.length)}
              className="absolute -top-2 -right-2 bg-vice-pink rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-vice-cyan/30 rounded-lg flex items-center justify-center hover:border-vice-cyan/50 transition-colors"
          aria-label="Add photo"
        >
          <Plus className="w-6 h-6 text-vice-cyan/60" />
        </button>
      </div>
    );
  };

  const handleSaveForm = async () => {
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
    
    setIsSaving(true);
    
    try {
      // Get violation types as an array of selected options
      const selectedViolations = [];
      if (formData.violationTypes.itemsTrashOutside) {
        const choice = formData.itemsTrashChoice || 'items';
        selectedViolations.push(`${choice === 'items' ? 'Items' : 'Trash'} left outside Unit`);
      }
      if (formData.violationTypes.balconyItems) {
        const location = formData.balconyChoice || 'balcony';
        selectedViolations.push(`Items left on ${location} railing`);
      }
      if (formData.violationTypes.parkingLotItems) {
        selectedViolations.push('Items left in Parking lot');
      }
      
      // Combine existing and new photos
      const allPhotos = [...existingPhotos, ...selectedImages];
      
      const formDataToSave = {
        user_id: user.id,
        unit_number: formData.unit,
        date: formData.date,
        time: `${formData.time} ${formData.ampm}`,
        location: selectedViolations.join(', '),
        description: formData.description,
        photos: allPhotos,
        status: 'saved'
      };
      
      let error: PostgrestError | null = null;
      if (id) {
        // Update existing record
        const result = await supabase
          .from('violation_forms')
          .update(formDataToSave)
          .eq('id', id);
        error = result.error;
      } else {
        // Create new record
        const result = await supabase
          .from('violation_forms')
          .insert(formDataToSave);
        error = result.error;
      }
      
      if (error) throw error;
      
      toast.success(id ? 'Form updated successfully!' : 'Form saved successfully!');
      navigate('/books');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return formData.unit.trim() && 
      (Object.values(formData.violationTypes).some(v => v) || formData.description.trim());
  };

  useEffect(() => {
    if (id) {
      const fetchFormData = async () => {
        const { data, error } = await supabase
          .from('violation_forms')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching form data:', error);
          toast.error('Failed to load form data');
          return;
        }
        
        if (data) {
          // Parse time string to separate time and AM/PM
          const timeParts = data.time.split(' ');
          const time = timeParts[0] || '';
          const ampm = timeParts[1] || 'AM';
          
          // Parse location string to determine violation types
          const violationTypes = {
            itemsTrashOutside: data.location.includes('Items left outside Unit') || data.location.includes('Trash left outside Unit'),
            balconyItems: data.location.includes('Items left on balcony railing') || data.location.includes('Items left on front railing'),
            parkingLotItems: data.location.includes('Items left in Parking lot'),
          };
          
          // Extract choices from location string
          let itemsTrashChoice = '';
          let balconyChoice = '';
          
          if (violationTypes.itemsTrashOutside) {
            itemsTrashChoice = data.location.includes('Trash left outside Unit') ? 'trash' : 'items';
          }
          
          if (violationTypes.balconyItems) {
            balconyChoice = data.location.includes('Items left on front railing') ? 'front' : 'balcony';
          }
          
          setFormData({
            date: data.date,
            unit: data.unit_number,
            time,
            ampm,
            violationTypes,
            itemsTrashChoice,
            balconyChoice,
            description: data.description,
          });
          
          // Set existing photos
          setExistingPhotos(data.photos || []);
        }
      };
      
      fetchFormData();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20 relative">
        <h1 className="text-xl font-bold">Details</h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 absolute right-4"
          onClick={() => navigate('/')}
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
          <TextureCard className="bg-black">
            <TextureCardContent className="space-y-6">
              {/* Date, Time, Unit Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-vice-cyan font-medium text-sm text-center block">Date</Label>
                  <Input
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="MM/DD"
                    maxLength={5}
                    className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center"
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
            </TextureCardContent>
          </TextureCard>
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