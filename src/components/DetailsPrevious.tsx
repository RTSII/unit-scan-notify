import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { GlowButton } from '../components/ui/shiny-button-1';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from '../components/core/morphing-popover';
import { motion } from 'framer-motion';
import {
  normalizeUnit,
  normalizeAndValidateUnit,
  isValidUnit,
  UNIT_FORMAT_HINT,
  UNIT_FORMAT_DESCRIPTION,
} from '@/utils/unitFormat';
import { TextureCard, TextureCardContent } from '../components/ui/texture-card';
import { Home, ArrowLeft as ArrowLeftIcon, Camera, X } from 'lucide-react';

type ViolationFormRow = Tables<'violation_forms'>;
type ViolationFormInsert = TablesInsert<'violation_forms'>;
type ViolationFormUpdate = TablesUpdate<'violation_forms'>;
type ViolationPhotoInsert = TablesInsert<'violation_photos'>;
type ViolationPhotoRow = Tables<'violation_photos'>;
type ViolationFormWithPhotos = ViolationFormRow & {
  violation_photos?: ViolationPhotoRow[] | null;
};

const VIOLATION_FORM_WITH_PHOTOS = `
  id,
  unit_number,
  occurred_at,
  location,
  description,
  violation_photos (
    id,
    storage_path,
    created_at
  )
` as const;

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

interface PhotoRecord {
  id: number;
  storage_path: string;
  created_at: string | null;
}

const MAX_PHOTOS = 4;

const formatDateForInput = (isoDate: string | null): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

const formatTimeForInput = (
  isoDate: string | null,
): { time: string; ampm: 'AM' | 'PM' } => {
  if (!isoDate) {
    return { time: '', ampm: 'AM' };
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return { time: '', ampm: 'AM' };
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const time = `${String(hours).padStart(2, '0')}:${minutes}`;
  return { time, ampm };
};

const parseLocationSelection = (location: string | null) => {
  const normalized = (location || '').toLowerCase();

  const itemsTrashOutside =
    normalized.includes('items left outside') || normalized.includes('trash left outside');
  const itemsTrashChoice =
    normalized.includes('trash left outside') ? 'trash' : itemsTrashOutside ? 'items' : '';

  const balconyItems =
    normalized.includes('balcony railing') || normalized.includes('front railing');
  const balconyChoice =
    normalized.includes('front railing') ? 'front' : balconyItems ? 'balcony' : '';

  const parkingLotItems = normalized.includes('parking lot');

  return {
    violationTypes: {
      itemsTrashOutside,
      balconyItems,
      parkingLotItems,
    },
    itemsTrashChoice,
    balconyChoice,
  };
};

const summarizeViolations = (form: ViolationFormData): string[] => {
  const violations: string[] = [];

  if (form.violationTypes.itemsTrashOutside) {
    const choice = form.itemsTrashChoice || 'items';
    violations.push(
      choice === 'trash' ? 'Trash left outside unit' : 'Items left outside unit',
    );
  }

  if (form.violationTypes.balconyItems) {
    const choice = form.balconyChoice || 'balcony';
    violations.push(`Items left on ${choice} railing`);
  }

  if (form.violationTypes.parkingLotItems) {
    violations.push('Items left in Parking lot');
  }

  return violations;
};

export default function DetailsPrevious() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ViolationFormData>({
    unit_number: '',
    date: '', // User manually enters date for previous violations
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
  const [existingPhotoRecords, setExistingPhotoRecords] = useState<PhotoRecord[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);
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

  // Unit validation and formatting with database check and auto-capitalization
  const handleUnitChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { unit, isValid } = normalizeAndValidateUnit(e.target.value);

    // Update form data with auto-capitalized unit (uppercase letters)
    setFormData((prev) => ({ ...prev, unit_number: unit }));

    if (unit.length === 0) {
      setIsUnitValid(null);
    } else if (unit.length === 3 && isValid) {
      // Once unit format is valid (3 chars), check against database
      const { data: validUnit } = await supabase
        .from('valid_units')
        .select('unit_number')
        .eq('unit_number', unit)
        .maybeSingle();
      
      setIsUnitValid(!!validUnit);
    } else {
      setIsUnitValid(isValid);
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

    const retainedExistingCount = existingPhotoRecords.filter(record => !photosToDelete.includes(record.id)).length;
    const remainingSlots = Math.max(0, 4 - retainedExistingCount - selectedImages.length);
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.error(`You can only attach up to 4 photos. ${remainingSlots} slot(s) remaining.`);
    }

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const toggleExistingPhoto = (photoId: number) => {
    setPhotosToDelete(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
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
          className="w-[calc(100vw-2rem)] max-w-md p-0 bg-black/90 border-vice-cyan/30"
          side="bottom"
          align="center"
          sideOffset={8}
          collisionPadding={16}
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
              className="w-full h-32 p-3 bg-black/40 border border-vice-cyan/30 text-white placeholder:text-white/60 rounded-lg resize-none focus:outline-none focus:border-vice-pink text-sm"
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

    const readAsDataURL = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

    const processPickedFiles = async (files: File[]) => {
      const retainedExistingCount = existingPhotoRecords.filter(
        (record) => !photosToDelete.includes(record.id),
      ).length;
      const remainingSlots = Math.max(0, 4 - retainedExistingCount - selectedImages.length);
      const filesToProcess = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        toast.error(`You can only attach up to 4 photos. ${remainingSlots} slot(s) remaining.`);
      }
      for (const file of filesToProcess) {
        const dataUrl = await readAsDataURL(file);
        setSelectedImages((prev) => [...prev, dataUrl]);
      }
    };

    const openImagesPicker = async () => {
      const anyWindow = window as any;
      if (typeof anyWindow.showOpenFilePicker !== 'function') return false;
      try {
        const handles = await anyWindow.showOpenFilePicker({
          multiple: true,
          excludeAcceptAllOption: true,
          types: [
            {
              description: 'Images',
              accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
            },
          ],
        });
        const files: File[] = [];
        for (const h of handles) {
          const f = await h.getFile();
          files.push(f);
        }
        await processPickedFiles(files);
        return true;
      } catch (e) {
        return false;
      }
    };

    const openAnyPicker = async () => {
      const anyWindow = window as any;
      if (typeof anyWindow.showOpenFilePicker !== 'function') return false;
      try {
        const handles = await anyWindow.showOpenFilePicker({
          multiple: true,
          excludeAcceptAllOption: false,
        });
        const files: File[] = [];
        for (const h of handles) {
          const f = await h.getFile();
          files.push(f);
        }
        await processPickedFiles(files);
        return true;
      } catch (e) {
        return false;
      }
    };

    const retainedExistingCount = existingPhotoRecords.filter(
      (record) => !photosToDelete.includes(record.id),
    ).length;
    const totalSelected = retainedExistingCount + selectedImages.length;

    return (
      <MorphingPopover open={isOpen} onOpenChange={setIsOpen}>
        <MorphingPopoverTrigger asChild>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ease-in-out min-h-[44px] min-w-[120px] transform-gpu ${totalSelected > 0 || isOpen
              ? 'bg-vice-pink text-white shadow-lg shadow-vice-pink/30 scale-105'
              : 'bg-black/40 border border-vice-cyan/30 text-vice-cyan hover:bg-vice-pink/20 hover:shadow-md hover:shadow-vice-pink/20'
              }`}
          >
            <Camera className="w-4 h-4" />
            <span className="font-medium text-sm">
                Photos ({totalSelected}/{MAX_PHOTOS})
              </span>
            </button>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent 
          className="w-[calc(100vw-2rem)] max-w-md p-0 bg-black/90 border-vice-cyan/30"
          side="bottom"
          align="center"
          sideOffset={8}
          collisionPadding={16}
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
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={async () => {
                  const handled = await openImagesPicker();
                  if (!handled) photoInputRef.current?.click();
                }}
                disabled={totalSelected >= MAX_PHOTOS}
                className="w-full bg-vice-cyan hover:bg-vice-cyan/80 text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-2"
              >
                Photo Library
              </Button>
              <Button
                onClick={async () => {
                  const handled = await openAnyPicker();
                  if (!handled) fileInputRef.current?.click();
                }}
                disabled={totalSelected >= MAX_PHOTOS}
                className="w-full bg-vice-cyan hover:bg-vice-cyan/80 text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-2"
              >
                Choose Files
              </Button>
            </div>

            {totalSelected >= MAX_PHOTOS && (
              <p className="text-xs text-vice-cyan text-center">
                Maximum of {MAX_PHOTOS} photos per violation.
              </p>
            )}

            {existingPhotoRecords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white text-sm font-medium">Existing Photos</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {existingPhotoRecords.map(photo => {
                    const isMarkedForDeletion = photosToDelete.includes(photo.id);
                    return (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.storage_path}
                          alt="Existing"
                          className={`w-full h-20 object-cover rounded border ${isMarkedForDeletion ? 'border-red-500 opacity-60' : 'border-vice-cyan/30'}`}
                        />
                        <button
                          onClick={() => toggleExistingPhoto(photo.id)}
                          className={`absolute inset-0 flex items-center justify-center rounded ${isMarkedForDeletion ? 'bg-red-500/40 text-white' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'} transition-opacity`}
                        >
                          {isMarkedForDeletion ? 'Undo Remove' : 'Remove'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

  const selectedViolations = (() => {
    return summarizeViolations(formData);
  })();

  const handleSaveForm = async () => {
    if (!user) {
      toast.error('You must be logged in to save forms');
      return;
    }

    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { unit: normalizedUnit, isValid } = normalizeAndValidateUnit(formData.unit_number);

    setIsUnitValid(normalizedUnit.length === 0 ? null : isValid);

    if (!isValid) {
      toast.error(`Unit number must follow the format ${UNIT_FORMAT_DESCRIPTION}.`);
      return;
    }

    setIsSaving(true);
    try {
      const activeExistingPhotos = existingPhotoRecords.filter(
        (record) => !photosToDelete.includes(record.id),
      );
      const totalPhotoCount = activeExistingPhotos.length + selectedImages.length;

      if (totalPhotoCount > MAX_PHOTOS) {
        toast.error('You can only attach up to 4 photos total.');
        return;
      }

      let occurredAt: string | null = null;
      if (formData.date.trim()) {
        const [monthPart, dayPart] = formData.date.split('/');
        const month = Number(monthPart);
        const day = Number(dayPart);

        if (!Number.isNaN(month) && !Number.isNaN(day)) {
          let hours = 12;
          let minutes = 0;

          if (formData.time) {
            const [hourPart, minutePart] = formData.time.split(':');
            const parsedHours = Number(hourPart);
            const parsedMinutes = Number(minutePart);

            if (!Number.isNaN(parsedHours)) {
              hours = parsedHours;
            }
            if (!Number.isNaN(parsedMinutes)) {
              minutes = parsedMinutes;
            }
          }

          if (formData.ampm === 'PM' && hours < 12) {
            hours += 12;
          }
          if (formData.ampm === 'AM' && hours === 12) {
            hours = 0;
          }

          const timestamp = new Date(new Date().getFullYear(), month - 1, day, hours, minutes);
          if (!Number.isNaN(timestamp.getTime())) {
            occurredAt = timestamp.toISOString();
          }
        }
      }

      const locationSummary = selectedViolations.join(', ');
      const nowIso = new Date().toISOString();
      const basePayload = {
        unit_number: normalizedUnit,
        occurred_at: occurredAt,
        location: locationSummary || null,
        description: formData.description || null,
        status: 'saved' as const,
        created_at: nowIso,
      } satisfies Omit<ViolationFormInsert, 'user_id'>;

      const insertPayload: ViolationFormInsert = {
        user_id: user.id,
        ...basePayload,
      };

      const updatePayload: ViolationFormUpdate = {
        user_id: user.id,
        ...basePayload,
      };

      const numericId = id ? Number(id) : null;
      let savedFormId: number | null = null;

      if (numericId !== null) {
        if (Number.isNaN(numericId)) {
          throw new Error('Invalid violation ID');
        }

        const { data, error } = await supabase
          .from('violation_forms')
          .update(updatePayload)
          .eq('id', numericId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedFormId = data?.id ?? null;
      } else {
        const { data, error } = await supabase
          .from('violation_forms')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedFormId = data?.id ?? null;
      }

      if (!savedFormId) {
        throw new Error('Unable to determine saved violation ID');
      }

      if (photosToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('violation_photos')
          .delete()
          .in('id', photosToDelete);

        if (deleteError) {
          throw deleteError;
        }
      }

      if (selectedImages.length > 0) {
        const photoRows: ViolationPhotoInsert[] = [];

        const dataUrlToCompressedBlob = async (
          dataUrl: string,
          maxDim = 1600,
          quality = 0.8,
          outputType: 'image/jpeg' | 'image/webp' = 'image/jpeg'
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
                reject(new Error('Canvas 2D context unavailable'));
                return;
              }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    try {
                      const fallback = canvas.toDataURL(outputType, quality);
                      const m = fallback.match(/^data:(.*?);base64,(.*)$/);
                      const base64 = m ? m[2] : '';
                      const bytes = atob(base64);
                      const arr = new Uint8Array(bytes.length);
                      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                      resolve(new Blob([arr], { type: outputType }));
                    } catch (e) {
                      reject(new Error('Failed to compress image'));
                    }
                    return;
                  }
                  resolve(blob);
                },
                outputType,
                quality
              );
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = dataUrl;
          });
        };

        const randHex = (len = 12) => {
          const arr = new Uint8Array(len);
          (window.crypto || (window as any).msCrypto).getRandomValues(arr);
          return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
        };

        for (let i = 0; i < selectedImages.length; i++) {
          const dataUrl = selectedImages[i];
          const compressedBlob = await dataUrlToCompressedBlob(dataUrl, 1600, 0.8, 'image/jpeg');
          const contentType = 'image/jpeg';
          const ext = 'jpg';

          if (compressedBlob.size > 4 * 1024 * 1024) {
            toast.error('One image exceeded 4MB after compression and was skipped.');
            continue;
          }

          const fileName = `${savedFormId}_${Date.now()}_${i}_${randHex(8)}.${ext}`;
          const path = `${user.id}/${savedFormId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('violation-photos')
            .upload(path, compressedBlob, { contentType, upsert: false, cacheControl: '31536000' });
          if (uploadError) {
            throw uploadError;
          }

          // Store ONLY the path, NOT the public URL (generate URL on display)
          photoRows.push({
            violation_id: savedFormId,
            uploaded_by: user.id,
            storage_path: path,  // Store path: {user_id}/{formId}/{filename}.jpg
            created_at: nowIso,
          });
        }

        const { error: insertPhotosError } = await supabase
          .from('violation_photos')
          .insert(photoRows);

        if (insertPhotosError) {
          throw insertPhotosError;
        }
      }

      toast.success('Violation form saved successfully!');
      navigate('/books');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    const hasDate = formData.date.trim().length > 0;
    const normalizedUnit = normalizeUnit(formData.unit_number);
    const hasUnit = normalizedUnit.length === 3 && isValidUnit(normalizedUnit);
    const hasViolation = selectedViolations.length > 0 || formData.description.trim().length > 0;

    if (!hasDate) {
      console.warn('Form validation failed: Missing date');
    }
    if (!hasUnit) {
      console.warn('Form validation failed: Invalid unit');
    }
    if (!hasViolation) {
      console.warn('Form validation failed: No violation type selected');
    }

    return hasDate && hasUnit && isUnitValid !== false && hasViolation;
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    const numericIdParam = Number(id);
    if (Number.isNaN(numericIdParam)) {
      toast.error('Invalid violation ID');
      return;
    }

    const fetchFormData = async () => {
      const { data, error } = await supabase
        .from('violation_forms')
        .select(VIOLATION_FORM_WITH_PHOTOS)
        .eq('id', numericIdParam)
        .single()
        .returns<ViolationFormWithPhotos>();

      if (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data');
        return;
      }

      if (!data) {
        return;
      }

      const { time, ampm } = formatTimeForInput(data.occurred_at ?? null);
      const locationSelections = parseLocationSelection(data.location ?? null);

      const { unit: normalizedUnit, isValid } = normalizeAndValidateUnit(data.unit_number ?? '');

      setFormData({
        unit_number: normalizedUnit,
        date: formatDateForInput(data.occurred_at ?? null),
        time,
        ampm,
        description: data.description ?? '',
        violationTypes: locationSelections.violationTypes,
        itemsTrashChoice: locationSelections.itemsTrashChoice,
        balconyChoice: locationSelections.balconyChoice,
      });

      setIsUnitValid(normalizedUnit.length === 0 ? null : isValid);

      const violationPhotos = Array.isArray(data.violation_photos) ? data.violation_photos : [];
      const photoRecords: PhotoRecord[] = violationPhotos.map((photo) => ({
        id: photo.id,
        storage_path: photo.storage_path,
        created_at: photo.created_at ?? null,
      }));

      setExistingPhotoRecords(photoRecords);
      setPhotosToDelete([]);
      setSelectedImages([]);
    };

    fetchFormData();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue text-white flex flex-col">
      {/* Header */}
      <div className="relative flex items-center p-6 bg-black/20 backdrop-blur-sm border-b border-vice-cyan/20">
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img 
            src="/nv.png" 
            alt="New Violation header" 
            className="h-24 w-auto object-contain"
            loading="eager"
          />
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-vice-cyan/20 min-h-[44px] min-w-[44px]"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
          <TextureCard className="bg-black border border-vice-cyan/20 [&>*>*>*>*]:!bg-black">
            <TextureCardContent className="space-y-6">
              {/* Date, Time, Unit Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-vice-cyan font-medium text-sm text-center block">Date</Label>
                  <Input
                    value={formData.date}
                    onChange={handleDateChange}
                    placeholder="MM/DD"
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9/]*"
                    className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center w-[82px] mx-auto px-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-vice-cyan font-medium text-sm text-center block">Time</Label>
                  <div className="flex gap-2 justify-center items-center">
                    <Input
                      value={formData.time}
                      onChange={handleTimeChange}
                      placeholder="HH:MM"
                      maxLength={5}
                      inputMode="numeric"
                      pattern="[0-9:]*"
                      className="bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center w-[82px] px-2"
                    />
                    <select
                      value={formData.ampm}
                      onChange={(e) => setFormData(prev => ({ ...prev, ampm: e.target.value }))}
                      className="bg-black/40 border border-vice-cyan/30 text-white text-xs h-11 px-2 rounded-md w-[52px] text-center"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-vice-cyan font-medium text-sm text-center block">Unit ({UNIT_FORMAT_HINT})</Label>
                  <div className="relative">
                    <Input
                      value={formData.unit_number}
                      onChange={handleUnitChange}
                      placeholder="A1B"
                      maxLength={3}
                      className={`bg-black/40 border-vice-cyan/30 text-white placeholder:text-white/60 text-base h-11 text-center w-[58px] mx-auto px-2 ${isUnitValid === false ? 'border-red-500' : isUnitValid === true ? 'border-green-500' : ''
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
              <div className="flex gap-3 justify-center items-center">
                <DescriptionPopover />
                <PhotosPopover />
              </div>

              {/* Book Em Button */}
              <div className="flex justify-center pt-4">
                <GlowButton
                  onClick={handleSaveForm}
                  disabled={!isFormValid() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Book Em'}
                </GlowButton>
              </div>
            </TextureCardContent>
          </TextureCard>
        </div>
      </div>
    </div>
  );
}