import React, { useMemo, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { Trash2, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from './core/morphing-popover';

export interface FormLike {
  id: number;
  unit_number: string | null;
  occurred_at: string | null;
  created_at: string | null;
  description?: string | null;
  location?: string | null;
  photos?: Array<{
    id: number;
    storage_path: string;
    public_url?: string;
  }>;
}

export type CarouselItem = {
  id: string;
  imageUrl: string;
  unit: string;
  date: string;
};

export function mapFormsToCarouselItems(forms: FormLike[]): CarouselItem[] {
  return (forms || []).map((form, index) => ({
    id: form.id.toString(),
    imageUrl: `https://picsum.photos/400/400?violation-${index}`,
    date: form.occurred_at 
      ? new Date(form.occurred_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric", 
          year: "numeric",
        })
      : new Date(form.created_at || '').toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    unit: form.unit_number || 'Unknown',
  }));
}

export const ViolationCarousel3D: React.FC<{ 
  forms: FormLike[];
  onDelete?: (formId: number) => Promise<void>;
}> = ({ forms, onDelete }) => {
  const [selectedForDelete, setSelectedForDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const controls = useAnimation();
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");

  const baseItems = useMemo(() => {
    const items = mapFormsToCarouselItems(forms);
    return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
  }, [forms]);

  const targetFaces = isScreenSizeSm ? 12 : 16;
  const cylinderWidth = isScreenSizeSm ? 1400 : 2000;
  const maxThumb = isScreenSizeSm ? 80 : 120;

  const displayItems = useMemo(() => {
    if (baseItems.length >= targetFaces) return baseItems;
    const fillers = Array.from({ length: targetFaces - baseItems.length }, (_, idx) => {
      const src = baseItems[idx % baseItems.length];
      if (!src || src.imageUrl === "placeholder") {
        return { 
          id: `placeholder-${idx + 2}`, 
          imageUrl: "placeholder", 
          date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
          unit: `${String.fromCharCode(65 + (idx % 26))}${Math.floor(idx / 26) + 1}`
        } as CarouselItem;
      }
      return { ...src, id: `${src.id}-dup-${idx}` } as CarouselItem;
    });
    return [...baseItems, ...fillers];
  }, [baseItems, targetFaces]);

  const faceCount = displayItems.length;
  const faceWidth = Math.min(maxThumb, cylinderWidth / Math.max(targetFaces, 1));
  const radius = cylinderWidth / (2 * Math.PI);

  const rotation = useMotionValue(0);
  const transform = useTransform(rotation, (value) => `rotate3d(0, 1, 0, ${value}deg)`);

  const handleDelete = async (e: React.MouseEvent, formId: number, index: number) => {
    e.stopPropagation();
    
    if (selectedForDelete !== index || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(formId);
      setSelectedForDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 3D Carousel */}
      <div className="relative h-[200px] w-full overflow-hidden rounded-xl bg-black/20 py-4">
        <div
          className="flex h-full items-center justify-center bg-black/10"
          style={{ perspective: "1000px", transformStyle: "preserve-3d", willChange: "transform" }}
        >
          <motion.div
            drag="x"
            className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
            style={{ transform, rotateY: rotation, width: cylinderWidth, transformStyle: "preserve-3d" }}
            onDrag={(_, info) => rotation.set(rotation.get() + info.offset.x * 0.05)}
            onDragEnd={(_, info) =>
              controls.start({ 
                rotateY: rotation.get() + info.velocity.x * 0.1, 
                transition: { type: "spring", stiffness: 100, damping: 30, mass: 0.1 } 
              })
            }
            animate={controls}
          >
            {displayItems.map((item, i) => (
              <MorphingPopover key={`key-${item.imageUrl}-${i}`}>
                <MorphingPopoverTrigger asChild>
                  <motion.div
                    className="absolute flex h-full origin-center items-center justify-center rounded-2xl p-1 cursor-pointer"
                    style={{ width: `${faceWidth}px`, transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)` }}
                  >
                    {item.imageUrl === "placeholder" ? (
                      <div className="relative w-full rounded-2xl bg-gray-900 ring-2 ring-vice-pink shadow-[0_0_12px_#ff1493,0_0_24px_#ff149350] aspect-square flex flex-col items-center justify-center">
                        <div className="text-lg font-bold text-vice-cyan mb-2">Date</div>
                        <div className="text-sm text-vice-cyan/80">Unit</div>
                      </div>
                    ) : (
                      <div className="relative w-full aspect-square">
                        <motion.img
                          src={item.imageUrl}
                          alt={`${item.unit} ${item.date}`}
                          className="pointer-events-none w-full rounded-2xl object-cover aspect-square ring-2 ring-vice-pink shadow-[0_0_12px_#ff1493,0_0_24px_#ff149350]"
                          initial={{ filter: "blur(4px)" }}
                          animate={{ filter: "blur(0px)" }}
                          transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                        />
                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                          <div className="text-sm text-vice-cyan/90 drop-shadow-[0_0_4px_#00ffff] font-medium bg-black/50 px-2 py-1 rounded">
                            {item.date}
                          </div>
                          <div className="text-sm font-semibold text-vice-cyan drop-shadow-[0_0_4px_#00ffff] bg-black/50 px-2 py-1 rounded">
                            {item.unit}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </MorphingPopoverTrigger>

                {/* Morphing Popover Content for each card */}
                {item.imageUrl !== "placeholder" && forms[i] && (
                  <MorphingPopoverContent 
                    className="z-[9999] w-full max-w-[92vw] sm:max-w-md md:max-w-lg p-0 bg-transparent border-0 shadow-none"
                    side="top"
                    align="center"
                    sideOffset={10}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="relative bg-black rounded-2xl border-2 border-vice-cyan shadow-[0_0_40px_#00ffff50] p-5 sm:p-6 max-h-[85vh] overflow-y-auto w-full"
                    >
                      {/* Close button and delete controls */}
                      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                        {onDelete && (
                          <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-vice-cyan/50">
                            <Checkbox
                              id={`delete-checkbox-${i}`}
                              checked={selectedForDelete === i}
                              onCheckedChange={(checked) => {
                                setSelectedForDelete(checked ? i : null);
                              }}
                              className="border-vice-cyan data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink w-4 h-4"
                            />
                            <button
                              onClick={(e) => handleDelete(e, forms[i].id, i)}
                              disabled={selectedForDelete !== i || isDeleting}
                              className={`p-1.5 rounded-md transition-all ${
                                selectedForDelete === i && !isDeleting
                                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              }`}
                              title={selectedForDelete === i ? 'Delete violation' : 'Check box to delete'}
                            >
                              {isDeleting && selectedForDelete === i ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Violation Details */}
                      <div className="space-y-4 mt-8">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-vice-cyan drop-shadow-[0_0_8px_#00ffff]">
                            Unit: {forms[i].unit_number || 'Unknown'}
                          </h3>
                          <p className="text-vice-pink/90 text-base sm:text-lg mt-2">
                            {forms[i].occurred_at
                              ? new Date(forms[i].occurred_at!).toLocaleDateString("en-US", {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Date unknown'}
                          </p>
                        </div>

                        {forms[i].location && (
                          <div>
                            <h4 className="text-vice-cyan/90 text-sm font-semibold mb-1">Location:</h4>
                            <p className="text-white/90 text-base">{forms[i].location}</p>
                          </div>
                        )}

                        {forms[i].description && (
                          <div>
                            <h4 className="text-vice-cyan/90 text-sm font-semibold mb-1">Description:</h4>
                            <p className="text-white/90 text-base leading-relaxed">{forms[i].description}</p>
                          </div>
                        )}

                        {/* Attached Photos */}
                        <div className="mt-6">
                          <h4 className="text-vice-cyan/90 text-sm font-semibold mb-3">Attached Photos</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {forms[i].photos && forms[i].photos!.length > 0 ? (
                              forms[i].photos!.map((photo) => (
                                <img
                                  key={photo.id}
                                  src={photo.public_url}
                                  alt="Violation photo"
                                  className="w-full h-16 sm:h-20 object-cover rounded-lg ring-1 ring-vice-pink shadow-[0_0_8px_#ff149330]"
                                />
                              ))
                            ) : (
                              <div className="text-white/60 text-sm col-span-2">No photos attached.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </MorphingPopoverContent>
                )}
              </MorphingPopover>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
