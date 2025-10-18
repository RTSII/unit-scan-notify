import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Power, Plus, Home } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "../integrations/supabase/types";
import { toast } from "sonner";
import {
  TextureCard,
  TextureCardContent,
} from "../components/ui/texture-card";
import {
  normalizeUnit,
  isValidUnit,
  UNIT_FORMAT_DESCRIPTION,
  UNIT_FORMAT_HINT,
} from "@/utils/unitFormat";

type ViolationFormRow = Tables<"violation_forms">;
type ViolationFormInsert = TablesInsert<"violation_forms">;
type ViolationPhotoInsert = TablesInsert<"violation_photos">;

const DetailsLive = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    unit: '',
    time: '',
    violationTypes: {
      itemsTrashOutside: false,
      balconyItems: false,
      parkingLotItems: false
    },
    itemsTrashChoice: '', // 'items' or 'trash'
    balconyChoice: '', // 'balcony' or 'front'
    description: ''
  });

  const handleUnitChange = (value: string) => {
    const normalized = normalizeUnit(value);

    setFormData(prev => ({
      ...prev,
      unit: normalized,
    }));
  };

  const saveForm = async () => {
    if (!user) return;

    // Validation: Check if Unit is filled and at least one violation is selected OR description is filled
    const hasViolations = Object.values(formData.violationTypes).some(violation => violation);
    const hasDescription = formData.description.trim().length > 0;

    const unitValue = formData.unit.trim();

    if (!unitValue) {
      toast.error('Unit number is required');
      return;
    }

    if (!isValidUnit(unitValue)) {
      toast.error(`Unit number must follow the format ${UNIT_FORMAT_DESCRIPTION}.`);
      return;
    }

    if (!hasViolations && !hasDescription) {
      toast.error('Please select at least one violation type or add a description');
      return;
    }

    if (isSaving) return;

    // Get violation types as an array of selected options
    const selectedViolations: string[] = [];
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

    // Prepare photos array - include captured image if available
    const photos = capturedImage ? [capturedImage] : [];

    // Convert date and time to occurred_at timestamp for violation_forms
    const occurredAt = (() => {
      try {
        // Parse MM/DD format and HH:MM AM/PM format
        const [month, day] = formData.date.split('/');
        const currentYear = new Date().getFullYear();
        
        // Parse time with AM/PM
        const timeMatch = formData.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!timeMatch) return new Date().toISOString();
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const dateObj = new Date(currentYear, parseInt(month) - 1, parseInt(day), hours, minutes);
        return dateObj.toISOString();
      } catch (error) {
        console.error('Error parsing date/time:', error);
        return new Date().toISOString();
      }
    })();

    try {
      setIsSaving(true);
      const locationSummary = selectedViolations.join(', ');
      const formPayload: ViolationFormInsert = {
        user_id: user.id,
        unit_number: normalizeUnit(unitValue),
        occurred_at: occurredAt,
        location: locationSummary || null,
        description: formData.description || null,
        status: 'saved',
      };

      const { data: formResult, error } = await supabase
        .from('violation_forms')
        .insert(formPayload)
        .select()
        .single();

      if (error) throw error;

      // Upload photos to Supabase Storage and save URLs to violation_photos table
      if (photos.length > 0 && formResult) {
        const formId = formResult.id;
        const nowIso = new Date().toISOString();

        // Helper: Compress base64 image
        const compressBase64Image = async (
          dataUrl: string,
          maxDim = 1600,
          quality = 0.8
        ): Promise<Blob> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const { width, height } = img;
              const scale = Math.min(1, maxDim / Math.max(width, height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(width * scale));
              canvas.height = Math.max(1, Math.round(height * scale));
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Canvas context unavailable'));
                return;
              }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  resolve(blob);
                },
                'image/jpeg',
                quality
              );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
          });
        };

        // Helper: Generate random hex string
        const randHex = (len = 12) => {
          const arr = new Uint8Array(len);
          crypto.getRandomValues(arr);
          return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
        };

        const photoRecords: ViolationPhotoInsert[] = [];

        for (let i = 0; i < photos.length; i++) {
          const photoBase64 = photos[i];
          
          try {
            // Compress image
            const compressedBlob = await compressBase64Image(photoBase64, 1600, 0.8);
            
            if (compressedBlob.size > 4 * 1024 * 1024) {
              console.warn('Photo exceeded 4MB after compression, skipping');
              continue;
            }

            // Generate unique filename
            const fileName = `${formId}_${i}_${Date.now()}.jpg`;
            const path = `${user.id}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('violation-photos')
              .upload(path, compressedBlob, {
                contentType: 'image/jpeg',
                upsert: false,
                cacheControl: '31536000'
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              continue;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('violation-photos')
              .getPublicUrl(path);

            photoRecords.push({
              violation_id: formId,
              uploaded_by: user.id,
              storage_path: path, // Store the storage path, not the full URL
              created_at: nowIso,
            });
          } catch (compressionError) {
            console.error('Error processing photo:', compressionError);
          }
        }

        // Save photo records to database
        if (photoRecords.length > 0) {
          const { error: photosError } = await supabase
            .from('violation_photos')
            .insert(photoRecords);

          if (photosError) {
            console.error('Error saving photo records:', photosError);
            // Don't throw - form is saved, just log the photo error
          }
        }
      }

      // Clear sessionStorage
      sessionStorage.removeItem('capturedImage');

      toast.success('Form saved successfully!');
      navigate('/books');
    } catch (error) {
      console.error('Error saving form:', error);
      const message = error instanceof Error ? error.message : 'Failed to save form';
      toast.error(message);
    } finally {
      setIsSaving(false);
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

    // Load captured image from sessionStorage if available
    const savedImage = sessionStorage.getItem('capturedImage');
    if (savedImage) {
      setCapturedImage(savedImage);
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
        <div className="p-3 sm:p-4 pb-24">
          <TextureCard className="max-w-md mx-auto bg-black">
            <TextureCardContent className="space-y-4">
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
                  <label className="text-vice-cyan font-medium text-xs sm:text-sm text-center block">Unit ({UNIT_FORMAT_HINT})</label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    placeholder=""
                    maxLength={3}
                    className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-sm h-9 sm:h-10 uppercase"
                  />
                </div>
              </div>

              {/* Violation Type Section - Compact */}
              <div className="space-y-3">
                <h3 className="text-vice-cyan font-medium text-sm sm:text-base text-center">Violation Type (Select applicable)</h3>

                <div className="space-y-2">
                  {/* Combined Items/Trash left outside Unit */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                      <Checkbox
                        checked={formData.violationTypes.itemsTrashOutside}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            violationTypes: { ...prev.violationTypes, itemsTrashOutside: !!checked },
                            itemsTrashChoice: checked ? 'items' : ''
                          }))
                        }
                        className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                      />
                      <label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Items/Trash left outside Unit</label>
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
                    <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                      <Checkbox
                        checked={formData.violationTypes.balconyItems}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            violationTypes: { ...prev.violationTypes, balconyItems: !!checked },
                            balconyChoice: checked ? 'balcony' : ''
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
                  <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg border border-vice-cyan/20 bg-black/20">
                    <Checkbox
                      checked={formData.violationTypes.parkingLotItems}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          violationTypes: { ...prev.violationTypes, parkingLotItems: !!checked }
                        }))
                      }
                      className="border-vice-cyan/50 data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink"
                    />
                    <label className="text-white cursor-pointer text-xs sm:text-sm leading-tight">Items left in Parking lot</label>
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
            </TextureCardContent>
          </TextureCard>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-vice-cyan/20 p-4">
        <div className="flex justify-center">
          <Button
            onClick={saveForm}
            disabled={isSaving}
            className="bg-vice-pink hover:bg-vice-pink/80 text-white px-8 py-3 rounded-full font-semibold text-base flex items-center justify-center gap-2 min-h-[48px] mx-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Book Em
                {photoCount > 0 && (
                  <span className="bg-white/20 rounded-full px-2 py-1 text-xs ml-1">
                    {photoCount}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailsLive;