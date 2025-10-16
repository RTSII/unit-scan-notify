import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { X, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, User, Hand } from "lucide-react";
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
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [activeForm, setActiveForm] = useState<FormLike | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(false);
  const [isGripMode, setIsGripMode] = useState(false);
  const [gripPosition, setGripPosition] = useState<{ x: number; y: number } | null>(null);
  const gripTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");


  const baseItems = useMemo(() => {
    const items = mapFormsToCarouselItems(forms);
    return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
  }, [forms]);

  // Mobile density: reduce faces for smoother perf and tighter control
  const targetFaces = isScreenSizeSm ? 10 : 14;
  // Smaller mobile cylinder to increase curvature (smaller radius)
  const cylinderWidth = isScreenSizeSm ? 1200 : 1800;
  const maxThumb = isScreenSizeSm ? 120 : 140;

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
    if (form) {
      setActiveForm(form);
      setIsPopoverOpen(true);
      setSelectedForDelete(false);
      setIsCarouselActive(false);
    }
  };

  const handleClose = useCallback(() => {
    setActiveForm(null);
    setIsPopoverOpen(false);
    setSelectedForDelete(false);
    setIsCarouselActive(true);
  }, []);

  const startGripTimer = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    if (gripTimerRef.current) {
      clearTimeout(gripTimerRef.current);
    }
    
    gripTimerRef.current = setTimeout(() => {
      setIsGripMode(true);
      setGripPosition({ x: clientX, y: clientY });
    }, 2000);
  }, []);

  const cancelGripTimer = useCallback(() => {
    if (gripTimerRef.current) {
      clearTimeout(gripTimerRef.current);
      gripTimerRef.current = null;
    }
    setIsGripMode(false);
    setGripPosition(null);
  }, []);

  const updateGripPosition = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (isGripMode) {
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      setGripPosition({ x: clientX, y: clientY });
    }
  }, [isGripMode]);

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
  // Stops when popover is open or card is hovered
  React.useEffect(() => {
    let animationFrameId: number;
    const autoRotateSpeed = 0.015;
    
    const autoRotate = () => {
      if (isCarouselActive && !isPopoverOpen && hoveredCardIndex === null) {
        rotation.set(rotation.get() - autoRotateSpeed);
      }
      animationFrameId = requestAnimationFrame(autoRotate);
    };

    animationFrameId = requestAnimationFrame(autoRotate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCarouselActive, isPopoverOpen, hoveredCardIndex, rotation]);

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

  // Click outside to close popover
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPopoverOpen, handleClose]);

  return (
    <div className={`w-full ${containerClassName ?? ''}`.trim()} id="carousel-container" ref={containerRef}>
      <motion.div layout className="relative w-full mb-8 sm:mb-10">

        <div 
          className={`relative ${heightClass ?? 'h-[140px] sm:h-[160px]'} w-full overflow-hidden rounded-xl bg-black/20 py-1`}
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div
            className="flex h-full items-center justify-center bg-black/10 px-4 sm:px-6"
            style={{
              perspective: isScreenSizeSm ? "600px" : "800px", 
              transformStyle: "preserve-3d", 
              willChange: "transform"
            }}
          >
            <motion.div
              drag={isCarouselActive ? "x" : false}
              dragElastic={0.05}
              dragMomentum={true}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
              className="relative flex h-full origin-center justify-center select-none cursor-grab active:cursor-grabbing"
              style={{ 
                transform, 
                rotateY: rotation, 
                width: cylinderWidth, 
                transformStyle: "preserve-3d",
                willChange: 'transform',
                touchAction: 'none'
              }}
              onPointerDown={(e) => {
                startGripTimer(e as any);
              }}
              onPointerUp={() => {
                cancelGripTimer();
              }}
              onPointerCancel={() => {
                cancelGripTimer();
              }}
              onPointerLeave={() => {
                cancelGripTimer();
              }}
              onDrag={(_, info) => {
                if (isCarouselActive) {
                  // Enhanced sensitivity in grip mode for precise control
                  const baseSensitivity = isScreenSizeSm ? 0.25 : 0.18;
                  const gripMultiplier = isGripMode ? 0.7 : 1; // More precise in grip mode
                  const sensitivity = baseSensitivity * gripMultiplier;
                  rotation.set(rotation.get() + info.offset.x * sensitivity);
                }
              }}
              onDragEnd={(_, info) => {
                cancelGripTimer();
                if (isCarouselActive) {
                  // Apply physics/inertia with velocity-based momentum
                  const velocityMultiplier = isScreenSizeSm ? 0.12 : 0.1;
                  const velocity = info.velocity.x;
                  
                  // Enhanced momentum for fast swipes/flicks
                  const momentumBoost = Math.abs(velocity) > 500 ? 1.3 : 1;
                  
                  controls.start({
                    rotateY: rotation.get() + velocity * velocityMultiplier * momentumBoost,
                    transition: { 
                      type: "spring", 
                      stiffness: 100, 
                      damping: 22, 
                      mass: 0.2,
                      velocity: velocity * 0.01
                    }
                  });
                }
              }}
              animate={controls}
            >
              {displayItems.map((item, i) => (
                <motion.div
                  key={`key-${item.imageUrl}-${i}`}
                  data-card-index={i}
                  className="absolute flex h-full origin-center items-center justify-center rounded-2xl p-2 sm:p-3 pointer-events-none"
                  style={{
                    width: `${faceWidth}px`, 
                    transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    opacity: 1,
                    willChange: 'transform'
                  }}
                >
                  {item.imageUrl === "placeholder" ? (
                    <div className="relative w-full rounded-2xl bg-black ring-1 ring-vice-cyan aspect-square opacity-100" />
                  ) : (
                     <div 
                      className="relative w-full aspect-square pointer-events-auto"
                      onClick={() => handleClick(item.fullForm)}
                      onMouseEnter={() => handleCardHover(i)}
                      onMouseLeave={() => handleCardHover(null)}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        updateGripPosition(e as any);
                      }}
                    >
                      <motion.img
                        src={item.imageUrl}
                        alt={`${item.unit} ${item.date}`}
                        layoutId={`img-${item.imageUrl}-${i}`}
                        className="pointer-events-none w-full rounded-2xl object-cover aspect-square ring-2 ring-vice-cyan shadow-[0_0_12px_#00ffff,0_0_24px_#00ffff50] opacity-100"
                        initial={{ filter: "blur(4px)", opacity: 1 }}
                        layout="position"
                        animate={{ filter: "blur(0px)", opacity: 1 }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      />
                      {/* Overlay badges - Date left, Unit right */}
                      {(item.date || item.unit) && (
                        <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 p-1.5 sm:p-2 pointer-events-none z-10">
                          {item.date && (
                            <div className="text-[10px] sm:text-xs font-medium text-vice-pink drop-shadow-[0_0_6px_#ff1493] bg-black/50 backdrop-blur-sm ring-1 ring-vice-pink/40 px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">
                              {item.date}
                            </div>
                          )}
                          {item.unit && (
                            <div className="text-[10px] sm:text-xs font-semibold text-vice-pink drop-shadow-[0_0_6px_#ff1493] bg-black/50 backdrop-blur-sm ring-1 ring-vice-pink/40 px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">
                              {item.unit}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Grip Mode Hand Icon */}
        <AnimatePresence>
          {isGripMode && gripPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="fixed pointer-events-none z-50"
              style={{
                left: gripPosition.x - 20,
                top: gripPosition.y - 20,
              }}
            >
              <div className="relative">
                <Hand className="w-10 h-10 text-vice-pink drop-shadow-[0_0_12px_#ff1493]" />
                <div className="absolute inset-0 bg-vice-pink/30 blur-xl rounded-full animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isPopoverOpen && activeForm && (
            <div 
              className="w-full flex justify-center px-2 sm:px-0 mt-4"
              style={{ touchAction: 'auto' }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="w-full max-w-2xl p-0 bg-gradient-to-br from-vice-purple/20 via-black/95 to-vice-blue/20 border border-vice-cyan/30 backdrop-blur-sm rounded-2xl shadow-2xl"
              >
              <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-vice-cyan/20 scrollbar-track-transparent">
                {/* Header with title and close button */}
                <div className="flex items-center justify-between border-b border-vice-cyan/30 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">Violation Details</h3>
                    <p className="text-sm text-vice-cyan/70">Unit {activeForm.unit_number}</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
                    aria-label="Close"
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
