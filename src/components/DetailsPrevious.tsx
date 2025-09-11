import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Home, Camera, X, ArrowLeftIcon } from 'lucide-react';

import { TextureCard, TextureCardContent } from '../components/ui/texture-card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from '../components/core/morphing-popover';
import { motion } from 'motion/react';
import type { PostgrestError } from '@supabase/supabase-js';

interface ViolationFormData {
  unit_number: string;
  date: string;
  time: string;
  ampm: string;
  description: string;
  violationTypes: {
    itemsTrashOutside: boolean;
    balconyItems: boolean;
    parkingLotItems: boolean;
  };
  itemsTrashChoice: string;
  balconyChoice: string;
}

export default function DetailsPrevious() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ViolationFormData>({
    unit_number: '',
    date: '',
    time: '',
    ampm: 'AM',
    description: '',
    violationTypes: {
      itemsTrashOutside: false,
      balconyItems: false,
      parkingLotItems: false,
    },
    itemsTrashChoice: '',
    balconyChoice: '',
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnitValid, setIsUnitValid] = useState<boolean | null>(null);

  // Date formatting function
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    setFormData(prev => ({ ...prev, date: value }));
  };

  // Time formatting function
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length >= 2) {
      value = value.substring(0, 2) + ':' + value.substring(2, 4);
    }

    setFormData(prev => ({ ...prev, time: value }));
  };

  // Unit validation and formatting
  const handleUnitChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 3);
    setFormData(prev => ({ ...prev, unit_number: value }));

    if (value.length === 3) {
      // Remove the valid_units table query since it doesn't exist
      // Just allow any 3-character unit number for now
      setIsUnitValid(true);
    } else {
      setIsUnitValid(null);
    }
  };

  const handleViolationTypeChange = (type: keyof ViolationFormData['violationTypes'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      violationTypes: {
        ...prev.violationTypes,
        [type]: checked
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Description Popover Component
  const DescriptionPopover = () => {
    const [tempDescription, setTempDescription] = useState(formData.description);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
      setFormData(prev => ({ ...prev, description: tempDescription }));
      setIsOpen(false);
    };

    const handleBack = () => {
      setTempDescription(formData.description);
      setIsOpen(false);
    };

    return (
      <MorphingPopover open={isOpen} onOpenChange={setIsOpen}>
        <MorphingPopoverTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ease-in-out min-h-[44px] min-w-[120px] transform-gpu ${formData.description.trim() || isOpen
              ? 'bg-vice-pink text-white shadow-lg shadow-vice-pink/30 scale-105'
              : 'bg-black/40 border border-vice-cyan/30 text-vice-cyan hover:bg-vice-pink/20 hover:shadow-md hover:shadow-vice-pink/20'
              }`}
          >
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span className="font-medium text-sm">Description</span>
          </button>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent 
          className="w-80 p-0 bg-black/90 border-vice-cyan/30"
          side="bottom"
          align="center"
          avoidCollisions={false}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-vice-cyan font-medium">Add Description</h3>
            </div>
            <textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              placeholder="Enter violation details..."
              className="w-full h-32 p-3 bg-black/40 border border-vice-cyan/30 text-white placeholder:text-white/60 rounded-lg resize-none focus:outline-none focus:border-vice-pink"
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-vice-pink hover:bg-vice-pink/80 text-white"
              >
                Save
              </Button>
            </div>
          </motion.div>
        </MorphingPopoverContent>
      </MorphingPopover>
    );
  };

  // Photos Popover Component
  const PhotosPopover = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleDone = () => {
      setIsOpen(false);
    };

    return (
      <MorphingPopover open={isOpen} onOpenChange={setIsOpen}>
        <MorphingPopoverTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ease-in-out min-h-[44px] min-w-[120px] transform-gpu ${selectedImages.length > 0 || isOpen
              ? 'bg-vice-pink text-white shadow-lg shadow-vice-pink/30 scale-105'
              : 'bg-black/40 border border-vice-cyan/30 text-vice-cyan hover:bg-vice-pink/20 hover:shadow-md hover:shadow-vice-pink/20'
              }`}
          >
            <Camera className="w-4 h-4" />
            <span className="font-medium text-sm">
              Photos ({selectedImages.length})
            </span>
          </button>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent 
          className="w-80 p-0 bg-black/90 border-vice-cyan/30"
          side="bottom"
          align="center"
          avoidCollisions={false}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-vice-cyan font-medium">Attach Photos</h3>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-vice-cyan hover:bg-vice-cyan/80 text-black"
            >
              <Camera className="w-4 h-4 mr-2" />
              Select Photos
            </Button>

            {selectedImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white text-sm font-medium">Selected Photos ({selectedImages.length})</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-vice-cyan/30"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleDone}
                size="sm"
                className="bg-vice-pink hover:bg-vice-pink/80 text-white"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </MorphingPopoverContent>
      </MorphingPopover>
    );
  };

  const selectedViolations = Object.entries(formData.violationTypes)
    .filter(([_, isSelected]) => isSelected)
    .map(([type, _]) => {
      switch (type) {
        case 'itemsTrashOutside':
          return formData.itemsTrashChoice ? `Items/trash left outside unit (${formData.itemsTrashChoice})` : 'Items/trash left outside unit';
        case 'balconyItems':
          return formData.balconyChoice ? `Items left on ${formData.balconyChoice} railing` : 'Items left on balcony/front railing';
        case 'parkingLotItems':
          return 'Items left in Parking lot';
        default:
          return '';
      }
    })
    .filter(Boolean);

  const handleSaveForm = async () => {
    if (!user) {
      toast.error('You must be logged in to save forms');
      return;
    }

    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const allPhotos = [...existingPhotos, ...selectedImages];

      const formDataToSave = {
        user_id: user.id,
        unit_number: formData.unit_number,
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
    return formData.unit_number.trim() &&
      formData.unit_number.length === 3 &&
      isUnitValid !== false &&
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
          const timeMatch = data.time?.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
          const time = timeMatch ? timeMatch[1] : '';
          const ampm = timeMatch ? timeMatch[2].toUpperCase() : 'AM';

          setFormData({
            unit_number: data.unit_number || '',
            date: data.date || '',
            time: time,
            ampm: ampm,
            description: data.description || '',
            violationTypes: {
              itemsTrashOutside: data.location?.includes('Items/trash left outside unit') || false,
              balconyItems: data.location?.includes('balcony') || data.location?.includes('front') || false,
              parkingLotItems: data.location?.includes('Parking lot') || false,
            },
            itemsTrashChoice: data.location?.includes('(items)') ? 'items' : data.location?.includes('(trash)') ? 'trash' : '',
            balconyChoice: data.location?.includes('balcony') ? 'balcony' : data.location?.includes('front') ? 'front' : '',
          });

          if (data.photos) {
            setExistingPhotos(data.photos);
          }
        }
      };

      fetchFormData();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20 relative">
        <div className="flex flex-col items-center gap-2">
          <img 
            src="/nv.png" 
            alt="New Violation header" 
            className="h-12 w-auto"
            loading="eager"
          />
        </div>
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
                    onChange={handleDateChange}
                    placeholder="MM/DD"
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9/]*"
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
                      inputMode="numeric"
                      pattern="[0-9:]*"
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
                  <div className="relative">
                    <Input
                      value={formData.unit_number}
                      onChange={handleUnitChange}
                      placeholder="A1B"
                      maxLength={3}
                      className={`bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center w-20 mx-auto ${isUnitValid === false ? 'border-red-500' : isUnitValid === true ? 'border-green-500' : ''
                        }`}
                    />
                    {isUnitValid !== null && (
                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                        {isUnitValid ? (
                          <span className="text-green-500 text-sm">✓</span>
                        ) : (
                          <span className="text-red-500 text-sm">✗</span>
                        )}
                      </div>
                    )}
                  </div>
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
                      <Label className="text-white cursor-pointer text-sm leading-tight flex-1">Items/trash left outside unit</Label>
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

                  {/* Combined Balcony/Front items */}
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
                <DescriptionPopover />
                <PhotosPopover />
              </div>

              {/* Book Em Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSaveForm}
                  disabled={!isFormValid() || isSaving}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ease-in-out min-h-[44px] min-w-[120px] transform-gpu font-medium text-sm ${isFormValid() && !isSaving
                    ? 'bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink shadow-lg shadow-vice-pink/30 text-white scale-105'
                    : 'bg-gray-600/40 border border-gray-500/30 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {isSaving ? 'Saving...' : 'Book Em'}
                </Button>
              </div>
            </TextureCardContent>
          </TextureCard>
        </div>
      </div>
    </div>
  );
}