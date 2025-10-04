import React, { useMemo, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { Trash2, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from "../../components/motion-primitives/morphing-popover";

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(false);
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

  const handleClick = (imgUrl: string, index: number) => {
    if (imgUrl !== "placeholder") {
      setActiveIndex(index);
      setIsPopoverOpen(true);
    }
  };

  const handleClose = () => {
    setIsPopoverOpen(false);
    setActiveIndex(null);
    setSelectedForDelete(false);
  };
 
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!selectedForDelete || activeIndex === null || !onDelete) return;
    
    const activeForm = forms[activeIndex];
    if (!activeForm) return;

    setIsDeleting(true);
    try {
      await onDelete(activeForm.id);
      handleClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full">
      <MorphingPopover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
                <MorphingPopoverTrigger key={`key-${item.imageUrl}-${i}`} asChild>
                  <motion.div
                    className="absolute flex h-full origin-center items-center justify-center rounded-2xl p-1 cursor-pointer"
                    style={{ width: `${faceWidth}px`, transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)` }}
                    onClick={() => handleClick(item.imageUrl, i)}
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
              ))}
            </motion.div>
          </div>
        </div>

        {/* Morphing Popover Content */}
        {activeIndex !== null && forms[activeIndex] && (
          <MorphingPopoverContent className="z-[9999] w-full max-w-[92vw] sm:max-w-md md:max-w-lg lg:max-w-xl p-0 bg-transparent border-0">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-black rounded-2xl border-2 border-vice-cyan shadow-[0_0_40px_#00ffff50] p-5 sm:p-6 max-h-[85vh] overflow-y-auto w-full"
            >
              {/* Close button and delete controls */}
              <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
                {onDelete && (
                  <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-vice-cyan/50">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="delete-checkbox"
                        checked={selectedForDelete}
                        onCheckedChange={(checked) => setSelectedForDelete(checked as boolean)}
                        className="border-vice-cyan data-[state=checked]:bg-vice-pink data-[state=checked]:border-vice-pink w-5 h-5"
                      />
                      <label
                        htmlFor="delete-checkbox"
                        className="text-sm font-medium text-white cursor-pointer select-none"
                      >
                        Select to delete
                      </label>
                    </div>
                    <button
                      onClick={handleDelete}
                      disabled={!selectedForDelete || isDeleting}
                      className={`p-2.5 rounded-md transition-all ${
                        selectedForDelete && !isDeleting
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      title={selectedForDelete ? 'Delete violation' : 'Check the box to enable delete'}
                    >
                      {isDeleting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-black/80 border border-white/20 text-white hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Violation Details */}
              <div className="space-y-6 mt-12">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-bold text-vice-cyan drop-shadow-[0_0_8px_#00ffff]">
                      Unit: {forms[activeIndex].unit_number || 'Unknown'}
                    </h3>
                    <p className="text-vice-pink/90 text-lg mt-2">
                      {forms[activeIndex].occurred_at
                        ? new Date(forms[activeIndex].occurred_at!).toLocaleDateString("en-US", {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Date unknown'}
                    </p>
                  </div>
                </div>

                {forms[activeIndex].location && (
                  <div>
                    <h4 className="text-vice-cyan/90 text-base font-semibold mb-2">Location:</h4>
                    <p className="text-white/90 text-lg">{forms[activeIndex].location}</p>
                  </div>
                )}

                {forms[activeIndex].description && (
                  <div>
                    <h4 className="text-vice-cyan/90 text-base font-semibold mb-2">Description:</h4>
                    <p className="text-white/90 text-lg leading-relaxed">{forms[activeIndex].description}</p>
                  </div>
                )}

                {/* Attached Photos */}
                <div className="mt-8">
                  <h4 className="text-vice-cyan/90 text-base font-semibold mb-3">Attached Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {forms[activeIndex].photos && forms[activeIndex].photos!.length > 0 ? (
                      forms[activeIndex].photos!.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.public_url}
                          alt="Violation photo"
                          className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-xl ring-2 ring-vice-pink shadow-[0_0_12px_#ff1493,0_0_24px_#ff149350]"
                        />
                      ))
                    ) : (
                      <div className="text-white/60 text-sm">No photos attached.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </MorphingPopoverContent>
        )}
      </MorphingPopover>
    </div>
  );
};
