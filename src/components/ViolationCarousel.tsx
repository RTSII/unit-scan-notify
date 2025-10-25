import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { X, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, User } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

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
  violation_photos?: Array<{
    id: string;
    storage_path: string;
    created_at: string;
  }>;
}

export type CarouselItem = {
  id: string;
  imageUrl: string;
  unit: string;
  date: string; // already formatted string
  fullForm?: FormLike;
};

// Photo URL cache for performance (reduces repeated getPublicUrl calls)
const photoUrlCache = new Map<string, string>();

// Helper function to convert storage path to public URL with thumbnail optimization
function getPhotoUrl(storagePath: string, isThumbnail: boolean = true): string {
  // Create cache key
  const cacheKey = `${storagePath}-${isThumbnail}`;
  
  // Check cache first
  if (photoUrlCache.has(cacheKey)) {
    return photoUrlCache.get(cacheKey)!;
  }
  
  let url: string;
  
  // Check if already a full URL (starts with http/https or data:)
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('data:')) {
    // For full URLs from storage, add transformation params for thumbnails
    if (isThumbnail && storagePath.includes('supabase.co/storage')) {
      // Add width/height limit and quality reduction for smaller thumbnail payloads
      url = `${storagePath}?width=240&height=240&quality=55`;
    } else {
      url = storagePath;
    }
  } else {
    // Convert storage path to public URL
    const { data } = supabase.storage
      .from('violation-photos')
      .getPublicUrl(storagePath, {
        transform: isThumbnail ? {
          width: 240,
          height: 240,
          quality: 55
        } : undefined
      });
    url = data?.publicUrl || storagePath;
  }
  
  // Cache the result
  photoUrlCache.set(cacheKey, url);
  return url;
}

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
    
    // Convert storage path to public URL if needed
    const imageUrl = form.photos?.[0] ? getPhotoUrl(form.photos[0]) : "placeholder";
    
    return {
      id: form.id,
      imageUrl,
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
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");
  const isDraggingRef = useRef(false);
  const dragResetTimeoutRef = useRef<number | null>(null);

  const baseItems = useMemo(() => {
    const items = mapFormsToCarouselItems(forms);
    return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
  }, [forms]);

  // Mobile density and sizing per unified spec
  const targetFaces = isScreenSizeSm ? 10 : 14;
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
  // Optimized spacing: consistent gap between cards to prevent overlap
  const gapArc = isScreenSizeSm ? 18 : 24; // Increased gap for better visual separation
  const circumference = cylinderWidth;
  const availableSpace = circumference / Math.max(faceCount, 1);
  const faceWidth = Math.min(
    maxThumb,
    Math.max(70, availableSpace - gapArc) // Min 70px for readability
  );
  const radius = cylinderWidth / (2 * Math.PI);

  const rotation = useMotionValue(0);
  const transform = useTransform(rotation, (value) => `rotate3d(0, 1, 0, ${value}deg)`);

  // Track current rotation in degrees for hit-testing visible faces
  const [rotDeg, setRotDeg] = useState(0);
  
  // Reset rotation when displayItems change (filter switching)
  useEffect(() => {
    rotation.set(0);
    setRotDeg(0);
  }, [displayItems.length, rotation]);
  const lastUpdateRef = useRef<number>(0);
  useEffect(() => {
    // Initialize rotDeg immediately on mount
    setRotDeg(rotation.get());
    
    const unsub = rotation.on('change', (v) => {
      const now = Date.now();
      // Throttle updates to ~20fps to avoid re-rendering all faces every frame
      if (now - (lastUpdateRef.current || 0) > 50) {
        lastUpdateRef.current = now;
        setRotDeg(v);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [rotation]);

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

  const snapToNearestCard = useCallback(() => {
    const currentRotation = rotation.get();
    const degreesPerCard = 360 / faceCount;
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const nearestCardIndex = Math.round(normalizedRotation / degreesPerCard);
    const targetRotation = nearestCardIndex * degreesPerCard;
    
    controls.start({
      rotateY: currentRotation + (targetRotation - normalizedRotation),
      transition: { 
        type: "spring", 
        stiffness: 250, 
        damping: 32, 
        mass: 0.4
      }
    });
  }, [rotation, faceCount, controls]);

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
        if (isCarouselActive && !isPopoverOpen && hoveredCardIndex === null && !isDraggingRef.current) {
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

  // Image preloading effect - preload adjacent cards for smooth rotation
  useEffect(() => {
    if (displayItems.length === 0) return;
    
    const degreesPerCard = 360 / faceCount;
    const currentCardIndex = Math.round(rotDeg / degreesPerCard) % faceCount;
    
    // Preload current card and 3 adjacent cards (left and right)
    const indicesToPreload = [
      currentCardIndex,
      (currentCardIndex + 1) % faceCount,
      (currentCardIndex + 2) % faceCount,
      (currentCardIndex - 1 + faceCount) % faceCount,
    ];
    
    indicesToPreload.forEach(idx => {
      const item = displayItems[idx];
      if (item && item.imageUrl && item.imageUrl !== 'placeholder') {
        // Create image object to trigger browser preload
        const img = new Image();
        img.src = item.imageUrl;
      }
    });
  }, [rotDeg, displayItems, faceCount]);

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

  // Lazy-load full photo set for the active form when popover opens (initial queries may limit to 1 photo)
  useEffect(() => {
    const loadFullPhotos = async () => {
      if (!isPopoverOpen || !activeForm) return;
      const currentCount = (activeForm.violation_photos?.length ?? activeForm.photos?.length ?? 0);
      if (currentCount > 1) return; // Already have more than one photo

      const idNum = Number(activeForm.id);
      if (Number.isNaN(idNum)) return;

      const { data, error } = await supabase
        .from('violation_photos')
        .select('id, storage_path, created_at')
        .eq('violation_id', idNum)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error || !data) return;

      const paths = data
        .map((p) => p.storage_path)
        .filter((p): p is string => typeof p === 'string' && p.length > 0);

      setActiveForm((prev) => prev ? {
        ...prev,
        photos: paths,
        violation_photos: data.map((p) => ({ id: String(p.id), storage_path: p.storage_path ?? '', created_at: p.created_at ?? '' }))
      } : prev);
    };

    loadFullPhotos();
  }, [isPopoverOpen, activeForm]);

  return (
    <div className={`w-full ${containerClassName ?? ''}`.trim()} id="carousel-container" ref={containerRef}>
      <div className="relative w-full mb-8 sm:mb-10">

        <div 
          className={`relative ${heightClass ?? 'h-[140px] sm:h-[160px]'} w-full overflow-hidden rounded-xl bg-black/20`}
          style={{ touchAction: 'pan-y' }}
          onTouchStart={(e) => { e.stopPropagation(); }}
          onTouchMove={(e) => { e.stopPropagation(); }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
        >
          <div
            className="flex h-full items-center justify-center bg-black/10 px-2 sm:px-4"
            style={{
              perspective: isScreenSizeSm ? "900px" : "800px", 
              transformStyle: "preserve-3d", 
              willChange: "transform"
            }}
          >
            <motion.div
              className="relative flex h-full origin-center justify-center select-none"
              style={{ 
                transform, 
                rotateY: rotation, 
                width: cylinderWidth, 
                transformStyle: "preserve-3d",
                willChange: 'transform',
                touchAction: 'pan-y',
                pointerEvents: 'none'
              }}
              animate={controls}
            >
              {displayItems.map((item, i) => {
                const cardAngle = (i * (360 / faceCount) + rotDeg) % 360;
                const normalizedAngle = ((cardAngle + 180) % 360) - 180;
                const isVisible = Math.abs(normalizedAngle) < 90; // Improved visibility check
                
                return (
                  <motion.div 
                    key={`key-${item.imageUrl}-${i}`}
                    data-card-index={i}
                    className="absolute flex h-full origin-center items-center justify-center px-2"
                    style={{
                      width: `${faceWidth}px`,
                      transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      opacity: isVisible ? 1 : 0.3,
                      willChange: 'transform',
                      pointerEvents: 'none',
                      touchAction: 'pan-y',
                      zIndex: isVisible ? 10 : 1
                    }}
                  >
                    {item.imageUrl === "placeholder" ? (
                      <motion.div 
                        className="relative w-full rounded-xl bg-black/90 ring-1 ring-vice-cyan/50 aspect-square opacity-100 shadow-lg"
                        drag={isCarouselActive ? "x" : false}
                        dragElastic={0}
                        dragMomentum={true}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragTransition={{ bounceStiffness: 0, bounceDamping: 0 }}
                        style={{ 
                          pointerEvents: isVisible ? 'auto' : 'none',
                          touchAction: isVisible ? 'none' : 'auto',
                          cursor: isCarouselActive ? 'grab' : 'default'
                        }}
                        onDragStart={() => {
                          isDraggingRef.current = true;
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); dragResetTimeoutRef.current = null; }
                        }}
                        onDrag={(_, info) => {
                          if (isCarouselActive) {
                            // Optimized sensitivity for smooth, fine control
                            const sensitivity = isScreenSizeSm ? 0.22 : 0.15;
                            rotation.set(rotation.get() + info.offset.x * sensitivity);
                          }
                        }}
                        onDragEnd={(_, info) => {
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); }
                          dragResetTimeoutRef.current = window.setTimeout(() => { isDraggingRef.current = false; }, 100);
                          if (isCarouselActive) {
                            const velocity = info.velocity.x;
                            const velocityThreshold = 500;
                            
                            if (Math.abs(velocity) > velocityThreshold) {
                              const velocityMultiplier = isScreenSizeSm ? 0.06 : 0.05;
                              const momentumRotation = velocity * velocityMultiplier;
                              
                              controls.start({
                                rotateY: rotation.get() + momentumRotation,
                                transition: { 
                                  type: "spring", 
                                  stiffness: 200, 
                                  damping: 28, 
                                  mass: 0.5
                                }
                              }).then(() => {
                                snapToNearestCard();
                              });
                            } else {
                              snapToNearestCard();
                            }
                          }
                        }}
                      />
                    ) : (
                      <motion.div 
                        drag={isCarouselActive ? "x" : false}
                        dragElastic={0}
                        dragMomentum={true}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragTransition={{ bounceStiffness: 0, bounceDamping: 0 }}
                        className="group relative w-full aspect-square overflow-hidden rounded-xl ring-2 ring-vice-cyan/80 shadow-lg hover:shadow-[0_0_16px_#00ffff,0_0_32px_#00ffff40] transition-shadow duration-300"
                        style={{ 
                          pointerEvents: isVisible ? 'auto' : 'none',
                          touchAction: isVisible ? 'none' : 'auto',
                          cursor: isCarouselActive ? 'grab' : 'default',
                          backgroundColor: '#0a0a0a'
                        }}
                        onClick={(e) => {
                          if (isDraggingRef.current) return;
                          handleClick(item.fullForm);
                        }}
                        onMouseEnter={() => handleCardHover(i)}
                        onMouseLeave={() => handleCardHover(null)}
                        onDragStart={() => {
                          isDraggingRef.current = true;
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); dragResetTimeoutRef.current = null; }
                        }}
                        onDrag={(_, info) => {
                          if (isCarouselActive) {
                            // Optimized sensitivity for smooth, fine control
                            const sensitivity = isScreenSizeSm ? 0.22 : 0.15;
                            rotation.set(rotation.get() + info.offset.x * sensitivity);
                          }
                        }}
                        onDragEnd={(_, info) => {
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); }
                          dragResetTimeoutRef.current = window.setTimeout(() => { isDraggingRef.current = false; }, 100);
                          if (isCarouselActive) {
                            const velocity = info.velocity.x;
                            const velocityThreshold = 500;
                            
                            if (Math.abs(velocity) > velocityThreshold) {
                              const velocityMultiplier = isScreenSizeSm ? 0.06 : 0.05;
                              const momentumRotation = velocity * velocityMultiplier;
                              
                              controls.start({
                                rotateY: rotation.get() + momentumRotation,
                                transition: { 
                                  type: "spring", 
                                  stiffness: 200, 
                                  damping: 28, 
                                  mass: 0.5
                                }
                              }).then(() => {
                                snapToNearestCard();
                              });
                            } else {
                              snapToNearestCard();
                            }
                          }
                        }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`${item.unit} ${item.date}`}
                          className="absolute inset-0 w-full h-full object-cover touch-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                          style={{ opacity: 1 }}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                        {/* Overlay badge - Combined Date & Unit */}
                        {(item.date || item.unit) && (
                          <div className="absolute inset-x-0 top-0 flex items-center justify-center p-2 pointer-events-none z-10">
                            <div className="text-[10px] sm:text-xs font-medium text-vice-pink drop-shadow-[0_0_10px_#ff1493] bg-black/40 backdrop-blur-md ring-1 ring-vice-cyan/40 px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap shadow-xl">
                              {item.unit && <span className="font-semibold">{item.unit}</span>}
                              {item.unit && item.date && <span className="mx-1.5 opacity-60">•</span>}
                              {item.date && <span>{item.date}</span>}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

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
                            src={getPhotoUrl(photo, false)}
                            alt={`Photo ${idx + 1}`}
                            loading="lazy"
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
      </div>
    </div>
  );
};
