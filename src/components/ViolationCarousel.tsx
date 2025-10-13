import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { X, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, User } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

export interface FormLike {
  id: string;
  unit_number: string;
  date?: string; // Legacy field - MM/DD format
  occurred_at?: string; // New field from migration - ISO timestamp
  photos?: string[];
  description?: string;
  location?: string;
  time?: string;
  status?: string;
  profiles?: {
    email: string;
    full_name: string | null;
    role: string;
  } | null;
}

export type CarouselItem = {
  id: string;
  imageUrl: string;
  unit: string;
  date: string; // already formatted string
  fullForm?: FormLike;
};

export function mapFormsToCarouselItems(forms: FormLike[]): CarouselItem[] {
  return (forms || []).map((form, index) => {
    // Handle both legacy 'date' field and new 'occurred_at' field
    let displayDate = '';
    if (form.date) {
      displayDate = form.date; // Already in MM/DD format
    } else if (form.occurred_at) {
      // Convert ISO timestamp to MM/DD format
      const dateObj = new Date(form.occurred_at);
      displayDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    }
    
    return {
      id: form.id,
      imageUrl: form.photos?.[0] || "placeholder",
      date: displayDate,
      unit: form.unit_number || '',
      fullForm: form,
    };
  });
}

export const ViolationCarousel3D: React.FC<{
  forms: FormLike[];
  onDelete?: (formId: string) => void;
  heightClass?: string;
  containerClassName?: string;
}> = ({ forms, onDelete, heightClass, containerClassName }) => {
  const [activeForm, setActiveForm] = useState<FormLike | null>(null);
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const [selectedForDelete, setSelectedForDelete] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const dragStart = useRef({ x: 0, rotation: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setIsCarouselActive(false);
    dragStart.current = { x: e.clientX, rotation: rotation.get() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    
    const step = 360 / faceCount;
    const currentRotation = rotation.get();
    const velocity = x.getVelocity() / 1000;
    const projectedRotation = currentRotation + velocity * 0.3; // Reduced momentum
    const targetRotation = Math.round(projectedRotation / step) * step;
    
    controls.start({
      rotateY: targetRotation,
      transition: { type: "spring", stiffness: 150, damping: 30, mass: 0.3 }
    });
    
    setIsCarouselActive(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const newRotation = dragStart.current.rotation + dx * 0.7; // Enhanced touch sensitivity
    rotation.set(newRotation);
    x.set(e.clientX);
  };

  const pointerActiveRef = useRef(false);
  const lastXRef = useRef(0);
  const totalDxRef = useRef(0);
  const sensitivity = 0.02;
  const clickThreshold = 3;

  const baseItems = useMemo(() => {
    const items = mapFormsToCarouselItems(forms);
    return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
  }, [forms]);

  // Mobile density: reduce faces for smoother perf and tighter control
  const targetFaces = isScreenSizeSm ? 10 : 14;
  // Smaller mobile cylinder to increase curvature (smaller radius)
  const cylinderWidth = isScreenSizeSm ? 1400 : 1900;
  const maxThumb = isScreenSizeSm ? 110 : 140;

  const displayItems = useMemo(() => {
    if (baseItems.length >= targetFaces) return baseItems;
    const fillers = Array.from({ length: targetFaces - baseItems.length }, (_, idx) => {
      const src = baseItems[idx % baseItems.length];
      if (!src || src.imageUrl === "placeholder") {
        return { 
          id: `placeholder-${idx + 2}`, 
          imageUrl: "placeholder", 
          date: "",
          unit: ""
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

  const handleClick = (form?: FormLike) => {
    // Only allow clicking on real cards with forms, not placeholders
    if (form) {
      setActiveForm(form);
      setIsPopoverOpen(true);
      setSelectedForDelete(false);
    }
  };

  const handleClose = () => {
    setActiveForm(null);
    setIsPopoverOpen(false);
    setSelectedForDelete(false);
  };

  const handleCardHover = (index: number | null) => {
    setHoveredCardIndex(index);
  };

  const handleDelete = () => {
    if (activeForm && selectedForDelete && onDelete) {
      onDelete(activeForm.id);
      handleClose();
    }
  };

  // Auto-rotation effect - clockwise (using requestAnimationFrame for smooth animation)
  // Stops on hover or when popover is open
  React.useEffect(() => {
    let animationFrameId: number;
    const autoRotateSpeed = 0.02; // Same speed as circular-gallery
    
    const autoRotate = () => {
      if (isCarouselActive && !isHovered && !isPopoverOpen && hoveredCardIndex === null) {
        rotation.set(rotation.get() - autoRotateSpeed); // Negative for clockwise rotation
      }
      animationFrameId = requestAnimationFrame(autoRotate);
    };

    animationFrameId = requestAnimationFrame(autoRotate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCarouselActive, isHovered, isPopoverOpen, hoveredCardIndex, rotation]);

  const formatDate = (form: FormLike) => {
    // Handle both legacy 'date' field and new 'occurred_at' field
    if (form.date) {
      return form.date; // Already in MM/DD format
    } else if (form.occurred_at) {
      // Convert ISO timestamp to MM/DD format
      const dateObj = new Date(form.occurred_at);
      return `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    }
    return '';
  };

  const formatViolationType = (location: string) => {
    // Extract only the selected option from the violation type string
    // Examples:
    // "Items/trash left outside unit (items)" -> "Items left outside unit"
    // "Items/trash left outside unit (trash)" -> "Trash left outside unit"
    // "Items left on balcony railing" -> "Items left on balcony railing"
    // "Items left on front railing" -> "Items left on front railing"
    
    if (!location) return '';
    
    // Check for items/trash pattern
    if (location.includes('Items/trash left outside unit')) {
      if (location.includes('(items)')) {
        return 'Items left outside unit';
      } else if (location.includes('(trash)')) {
        return 'Trash left outside unit';
      }
      return 'Items/trash left outside unit';
    }
    
    // Check for balcony/front pattern
    if (location.includes('balcony railing')) {
      return 'Items left on balcony railing';
    } else if (location.includes('front railing')) {
      return 'Items left on front railing';
    }
    
    // Return as-is for other types (e.g., "Items left in Parking lot")
    return location;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsCarouselActive(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`w-full ${containerClassName ?? ''}`.trim()} id="carousel-container" ref={containerRef}>
      <motion.div layout className="relative">

        <div 
          className={`relative ${heightClass ?? 'h-[200px]'} w-full overflow-hidden rounded-xl bg-black/20 py-1 sm:py-3 touch-none`}
        >
          <div
            className="flex h-full items-center justify-center bg-black/10"
            style={{ perspective: isScreenSizeSm ? "700px" : "1000px", transformStyle: "preserve-3d", willChange: "transform" }}
          >
            <motion.div
              className={`relative flex h-full origin-center justify-center touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ transform, rotateY: rotation, width: cylinderWidth, transformStyle: "preserve-3d", touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
              onPointerLeave={(e) => {
                if (isDragging) {
                  handlePointerUp(e);
                }
              }}
              animate={controls}
            >
              {displayItems.map((item, i) => (
                <motion.div
                  key={`key-${item.imageUrl}-${i}`}
                  className="absolute flex h-full origin-center items-center justify-center rounded-2xl p-0.5"
                  style={{ 
                    width: `${faceWidth}px`, 
                    transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
                    cursor: item.imageUrl === "placeholder" ? "default" : "pointer",
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    opacity: 1
                  }}
                  onClick={(e) => {
                    // Prevent click during drag
                    if (Math.abs(x.getVelocity()) > 200) {
                      e.stopPropagation();
                      return;
                    }
                    handleClick(item.fullForm);
                  }}
                >
                  {item.imageUrl === "placeholder" ? (
                    <div className="relative w-full rounded-2xl bg-black ring-1 ring-vice-cyan aspect-square opacity-100" />
                  ) : (
                    <div 
                      className="relative w-full aspect-square touch-none select-none"
                      onMouseEnter={() => setHoveredCardIndex(i)}
                      onMouseLeave={() => setHoveredCardIndex(null)}
                      onTouchStart={() => setHoveredCardIndex(i)}
                      onTouchEnd={() => setHoveredCardIndex(null)}
                    >
                      <motion.img
                        src={item.imageUrl}
                        alt={`${item.unit} ${item.date}`}
                        layoutId={`img-${item.imageUrl}-${i}`}
                        className="pointer-events-none w-full rounded-2xl object-cover aspect-square ring-2 ring-vice-pink shadow-[0_0_12px_#ff1493,0_0_24px_#ff149350] opacity-100"
                        initial={{ filter: "blur(4px)", opacity: 1 }}
                        layout="position"
                        animate={{ filter: "blur(0px)", opacity: 1 }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      />
                      {/* Overlay badges - Unit and Date */}
                      {(item.date || item.unit) && (
                        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 p-2 pointer-events-none z-10">
                          <div className="flex items-center gap-1.5">
                            {item.unit && (
                              <div className="text-xs font-semibold text-vice-cyan drop-shadow-[0_0_6px_#00ffff] bg-black/40 backdrop-blur-sm ring-1 ring-vice-cyan/30 px-1.5 py-0.5 rounded-md">
                                {item.unit}
                              </div>
                            )}
                            {item.date && (
                              <div className="text-xs font-medium text-vice-cyan drop-shadow-[0_0_6px_#00ffff] bg-black/40 backdrop-blur-sm ring-1 ring-vice-cyan/30 px-1.5 py-0.5 rounded-md">
                                {item.date}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isPopoverOpen && activeForm && (
            <div className="mt-6 w-full flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="w-[95vw] max-w-2xl p-0 bg-gradient-to-br from-vice-purple/20 via-black/95 to-vice-blue/20 border border-vice-cyan/30 backdrop-blur-sm rounded-2xl shadow-2xl"
              >
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Header with close button */}
                <div className="flex items-center justify-end border-b border-vice-cyan/30 pb-2">
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Details in specified order */}
                <div className="space-y-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <div className="text-vice-cyan text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                    <div className="text-white text-base">{formatDate(activeForm)}</div>
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <div className="text-vice-cyan text-sm font-medium">Unit</div>
                    <div className="text-white text-base font-semibold">{activeForm.unit_number}</div>
                  </div>

                  {/* Time (if present) */}
                  {activeForm.time && (
                    <div className="space-y-1">
                      <div className="text-vice-cyan text-sm font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Time
                      </div>
                      <div className="text-white text-base">{activeForm.time}</div>
                    </div>
                  )}

                  {/* Violation Type */}
                  {activeForm.location && (
                    <div className="space-y-1">
                      <div className="text-vice-cyan text-sm font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Violation Type
                      </div>
                      <div className="text-white text-base">{formatViolationType(activeForm.location)}</div>
                    </div>
                  )}

                  {/* Description (if present) */}
                  {activeForm.description && (
                    <div className="space-y-1">
                      <div className="text-vice-cyan text-sm font-medium">Description</div>
                      <div className="text-white text-base bg-black/40 p-3 rounded-lg border border-vice-cyan/20">
                        {activeForm.description}
                      </div>
                    </div>
                  )}

                  {/* Photos (if present) */}
                  {activeForm.photos && activeForm.photos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-vice-cyan text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Photos ({activeForm.photos.length})
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {activeForm.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-lg ring-1 ring-vice-cyan/30 hover:ring-2 hover:ring-vice-pink transition-all cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reported By */}
                  {activeForm.profiles && (
                    <div className="space-y-1">
                      <div className="text-vice-cyan text-sm font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Reported By
                      </div>
                      <div className="text-white text-base">
                        {activeForm.profiles.full_name || activeForm.profiles.email}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
