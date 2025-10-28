import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { X, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, User } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "./ui/snow-ball-loading-spinner";

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
// Enhanced cache with size management to prevent memory issues during scrolling
const photoUrlCache = new Map<string, string>();
const MAX_CACHE_SIZE = 200; // Limit cache size to prevent memory bloat

// Helper function to convert storage path to public URL with optimized sizing
// Note: Export.tsx uses its own getPublicUrl() function for full-quality export/print
function getPhotoUrl(storagePath: string, imageType: 'thumbnail' | 'expanded' | 'full' = 'thumbnail'): string {
  if (!storagePath) return 'placeholder';
  const cacheKey = `${storagePath}-${imageType}`;
  
  // Check cache first - this prevents expensive API calls
  if (photoUrlCache.has(cacheKey)) {
    return photoUrlCache.get(cacheKey)!;
  }
  
  let url: string;
  
  // Handle legacy full URLs vs storage paths
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    url = storagePath; // Already a full URL
  } else if (storagePath.startsWith('data:')) {
    url = storagePath; // Legacy base64 data URL
  } else {
    try {
      // Storage bucket path - convert to public URL
      const { data } = supabase.storage
        .from('violation-photos')
        .getPublicUrl(storagePath);
      
      url = data?.publicUrl || storagePath;
      
      // Add Supabase image transformations based on usage type
      if (url && url.includes('supabase') && !url.includes('data:')) {
        switch (imageType) {
          case 'thumbnail':
            // Ultra-aggressive optimization for carousel cards: 100x100px, 30% quality (~2-4KB)
            url += '?width=100&height=100&resize=cover&quality=30';
            break;
          case 'expanded': 
            // Aggressive optimization for viewing only: 400x400px, 50% quality (~30-60KB)
            url += '?width=400&height=400&resize=contain&quality=50';
            break;
          case 'full':
            // No optimization - original resolution for export/print
            break;
        }
      }
    } catch (error) {
      console.warn('Failed to generate photo URL:', error);
      url = 'placeholder';
    }
  }
  
  // Cache the result to prevent repeated API calls
  // Clean up old entries if cache gets too large during heavy scrolling
  if (photoUrlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = photoUrlCache.keys().next().value;
    photoUrlCache.delete(firstKey);
  }
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
    
    // Prioritize violation_photos (new storage) over legacy photos field
    let imageUrl = "placeholder";
    
    if (form.violation_photos && form.violation_photos.length > 0 && form.violation_photos[0].storage_path) {
      const storagePath = form.violation_photos[0].storage_path;
      imageUrl = getPhotoUrl(storagePath);
    } else if (form.photos && form.photos.length > 0 && form.photos[0]) {
      imageUrl = getPhotoUrl(form.photos[0]);
    }
    
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
  displayMode?: '3d-carousel' | 'grid'; // New prop for All Forms grid layout
}> = ({ forms, onDelete, heightClass, containerClassName, displayMode = '3d-carousel' }) => {
  const { user } = useAuth();
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [activeForm, setActiveForm] = useState<FormLike | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(false);
  const [activeTouchCardIndex, setActiveTouchCardIndex] = useState<number | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");
  const isDraggingRef = useRef(false);
  const dragResetTimeoutRef = useRef<number | null>(null);

  const baseItems = useMemo(() => {
    // Smart cache management: Only clear cache if completely different form set
    // This prevents clearing cache on filter switches (which use same forms, just filtered)
    const items = mapFormsToCarouselItems(forms);
    return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
  }, [forms]);

  // Mobile density and sizing per unified spec
  const targetFaces = isScreenSizeSm ? 10 : 14;
  const cylinderWidth = isScreenSizeSm ? 1200 : 1800;
  const maxThumb = isScreenSizeSm ? 120 : 140;
  
  // Smart carousel buffering constants for performance during "season"
  const CAROUSEL_CONSTANTS = {
    // Initial load - balance between UX and performance
    INITIAL_LOAD: isScreenSizeSm ? 15 : 20,
    // Maximum visible in carousel before requiring user action
    MAX_VISIBLE: isScreenSizeSm ? 25 : 35, 
    // Buffer size for smooth scrolling
    BUFFER_SIZE: 10,
    // Minimum items to maintain after cleanup
    MIN_BUFFER: isScreenSizeSm ? 8 : 12
  };

  // Grid layout constants for All Forms view - mobile first
  const GRID_CONSTANTS = {
    // Conservative 3x3 mobile grid to prevent overlap, 4x4 desktop
    COLUMNS: isScreenSizeSm ? 3 : 4,
    ROWS: isScreenSizeSm ? 3 : 4,
    // Items per page: 9 mobile, 16 desktop
    get ITEMS_PER_PAGE() { return this.COLUMNS * this.ROWS; }
  };

  const displayItems = useMemo(() => {
    // Smart buffering for performance during "season" (60+ violations)
    let itemsToShow = baseItems;
    let moreItemsAvailable = false;
    
    // If we have many items, implement smart loading
    if (baseItems.length > CAROUSEL_CONSTANTS.MAX_VISIBLE) {
      // Show most recent items first (already sorted by created_at DESC)
      itemsToShow = baseItems.slice(0, CAROUSEL_CONSTANTS.INITIAL_LOAD);
      moreItemsAvailable = true;
      
      // TODO: Implement progressive loading as user rotates
      // For now, show initial load to prevent performance issues
    }
    
    // Update hasMoreItems state
    setHasMoreItems(moreItemsAvailable);
    
    // Densify only if we have fewer items than target faces
    if (itemsToShow.length < targetFaces) {
      const fillers = Array.from({ length: targetFaces - itemsToShow.length }, (_, idx) => {
        const src = itemsToShow[idx % itemsToShow.length];
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
      itemsToShow = [...itemsToShow, ...fillers];
    }
    
    return itemsToShow;
  }, [baseItems, targetFaces, isScreenSizeSm]);

  // Grid pagination calculations
  const gridData = useMemo(() => {
    if (displayMode !== 'grid') return null;
    
    // Use original forms instead of baseItems (which are CarouselItems)
    const totalPages = Math.ceil(forms.length / GRID_CONSTANTS.ITEMS_PER_PAGE);
    const startIndex = currentPage * GRID_CONSTANTS.ITEMS_PER_PAGE;
    const endIndex = startIndex + GRID_CONSTANTS.ITEMS_PER_PAGE;
    const currentPageItems = forms.slice(startIndex, endIndex);
    
    
    return {
      totalPages,
      currentPageItems,
      hasNextPage: currentPage < totalPages - 1,
      hasPrevPage: currentPage > 0,
      totalItems: forms.length
    };
  }, [forms, currentPage, displayMode, GRID_CONSTANTS.ITEMS_PER_PAGE]);

  // Reset page when forms change
  useEffect(() => {
    setCurrentPage(0);
  }, [forms.length]);

  const faceCount = displayItems.length;
  
  // Dynamic sizing for infinite carousel - scales with actual item count
  const circumference = cylinderWidth;
  const radius = cylinderWidth / (2 * Math.PI);
  
  // Calculate optimal card width based on available space and item count
  const minCardWidth = isScreenSizeSm ? 65 : 75; // Minimum readable size
  const maxCardWidth = isScreenSizeSm ? 120 : 140; // Maximum for visual appeal
  const gapBetweenCards = isScreenSizeSm ? 8 : 12; // Consistent gap
  
  // Available space per card (circumference / number of cards - gap)
  const availableSpacePerCard = (circumference / faceCount) - gapBetweenCards;
  
  // Dynamic face width that scales with item count
  const faceWidth = Math.max(minCardWidth, Math.min(maxCardWidth, availableSpacePerCard));

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
    setExpandedImageUrl(null);
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

  const handleDelete = async () => {
    if (activeForm && selectedForDelete && onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(activeForm.id);
        handleClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Auto-rotation effect - clockwise (using requestAnimationFrame for smooth animation)
  // Stops when popover is open or card is hovered
  React.useEffect(() => {
    let animationFrameId: number;
    const autoRotateSpeed = 0.008;
    
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

  // Grid layout for All Forms
  const renderGridLayout = () => {
    if (!gridData) return null;

    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Grid Container */}
        <div className="flex-1 p-6 sm:p-8 overflow-hidden">
          <div 
            className={`grid gap-6 sm:gap-8 h-full`}
            style={{ 
              gridTemplateColumns: `repeat(${GRID_CONSTANTS.COLUMNS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_CONSTANTS.ROWS}, 1fr)`
            }}
          >
            {Array.from({ length: GRID_CONSTANTS.ITEMS_PER_PAGE }).map((_, index) => {
              const form = gridData.currentPageItems[index];
              
              // Handle empty slots (when there are fewer forms than grid slots)
              if (!form) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden"
                    style={{ backgroundColor: 'transparent', minHeight: '0', minWidth: '0' }}
                  >
                    {/* Empty slot - no content */}
                  </div>
                );
              }
              
              // Get image URL directly
              let imageUrl = "placeholder";
              if (form.violation_photos && form.violation_photos.length > 0 && form.violation_photos[0].storage_path) {
                imageUrl = getPhotoUrl(form.violation_photos[0].storage_path);
              } else if (form.photos && form.photos.length > 0 && form.photos[0]) {
                imageUrl = getPhotoUrl(form.photos[0]);
              }
              
              // Format date
              let displayDate = "";
              if (form.occurred_at) {
                const dateObj = new Date(form.occurred_at);
                displayDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
              }
              
              return (
                <div
                  key={form.id}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    activeTouchCardIndex === index 
                      ? 'ring-1 ring-vice-cyan shadow-[0_0_10px_#00ffff40]' 
                      : 'ring-1 ring-vice-cyan/40'
                  }`}
                  style={{ backgroundColor: '#0a0a0a', minHeight: '0', minWidth: '0' }}
                  onClick={() => handleClick(form)}
                  onTouchStart={() => setActiveTouchCardIndex(index)}
                  onTouchEnd={() => setActiveTouchCardIndex(null)}
                  onMouseDown={() => setActiveTouchCardIndex(index)}
                  onMouseUp={() => setActiveTouchCardIndex(null)}
                  onMouseLeave={() => setActiveTouchCardIndex(null)}
                >
                  {imageUrl === "placeholder" ? (
                    <div className="w-full h-full bg-black/90 ring-1 ring-vice-cyan/50 flex items-center justify-center">
                      <span className="text-vice-cyan/70 text-xs">No Photo</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={imageUrl}
                        alt={`${form.unit_number} ${displayDate}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const url = e.currentTarget.src;
                          if (url.includes('/public/public/')) {
                            e.currentTarget.src = url.replace('/public/public/', '/public/');
                          }
                        }}
                      />
                      {/* Overlay badge */}
                      {(displayDate || form.unit_number) && (
                        <div className="absolute inset-x-0 top-0 flex items-center justify-center p-1 pointer-events-none">
                          <div className="text-[8px] font-medium text-vice-pink drop-shadow-[0_0_8px_#ff1493] bg-black/50 backdrop-blur-sm ring-1 ring-vice-cyan/30 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {form.unit_number && <span className="font-semibold">{form.unit_number}</span>}
                            {form.unit_number && displayDate && <span className="mx-1 opacity-60">•</span>}
                            {displayDate && <span>{displayDate}</span>}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Page Info (temporary debug) */}
        <div className="text-center text-xs text-vice-cyan/70 p-2">
          Showing {gridData.currentPageItems.length} of {gridData.totalItems} forms
          {gridData.totalPages > 1 && ` (Page ${currentPage + 1} of ${gridData.totalPages})`}
        </div>

        {/* Pagination Controls */}
        {gridData.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-vice-cyan/20">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={!gridData.hasPrevPage}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-vice-cyan/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vice-cyan/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-white text-sm">
              Page {currentPage + 1} of {gridData.totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(gridData.totalPages - 1, prev + 1))}
              disabled={!gridData.hasNextPage}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-vice-cyan/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-vice-cyan/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative w-full ${containerClassName ?? ''}`.trim()} id="carousel-container" ref={containerRef}>
      <div className="relative w-full mb-8 sm:mb-10 isolate">

        {/* Conditional rendering: Grid for All Forms, 3D Carousel for others */}
        {displayMode === 'grid' ? (
          <div 
            className={`relative ${heightClass ?? 'h-[400px] sm:h-[500px]'} w-full overflow-hidden rounded-xl bg-black/20`}
          >
            {renderGridLayout()}
          </div>
        ) : (
        <div 
          className={`relative ${heightClass ?? 'h-[140px] sm:h-[160px]'} w-full overflow-hidden rounded-xl bg-black/20`}
          style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none', userSelect: 'none' }}
          onTouchStart={(e) => { e.stopPropagation(); }}
          onTouchMove={(e) => { e.stopPropagation(); }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
        >
          <div
            className="flex h-full items-center justify-center bg-black/10 px-2 sm:px-4 overflow-hidden"
            style={{
              perspective: isScreenSizeSm ? "900px" : "800px", 
              transformStyle: "preserve-3d",
              willChange: "transform",
              touchAction: 'pan-y'
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
                    className="absolute flex h-full origin-center items-center justify-center px-1"
                    style={{
                      width: `${faceWidth}px`,
                      transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      opacity: isVisible ? 1 : 0.3,
                      willChange: 'transform',
                      pointerEvents: isVisible ? 'auto' : 'none',
                      touchAction: isVisible ? 'none' : 'auto',
                      zIndex: isVisible ? 10 : 1
                    }}
                  >
                    {item.imageUrl === "placeholder" ? (
                      <motion.div 
                        className={`relative w-full rounded-xl bg-black/90 aspect-square opacity-100 shadow-lg transition-all duration-200 ${
                          activeTouchCardIndex === i 
                            ? 'ring-2 ring-vice-cyan shadow-[0_0_20px_#00ffff,0_0_40px_#00ffff60]' 
                            : 'ring-1 ring-vice-cyan/50'
                        }`}
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
                        onTouchStart={() => setActiveTouchCardIndex(i)}
                        onTouchEnd={() => setActiveTouchCardIndex(null)}
                        onMouseDown={() => setActiveTouchCardIndex(i)}
                        onMouseUp={() => setActiveTouchCardIndex(null)}
                        onMouseLeave={() => setActiveTouchCardIndex(null)}
                        onDragStart={() => {
                          isDraggingRef.current = true;
                          setActiveTouchCardIndex(i);
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); dragResetTimeoutRef.current = null; }
                        }}
                        onDrag={(_, info) => {
                          if (isCarouselActive) {
                            // Reduced sensitivity for finer control and UI stability (first occurrence)
                            const sensitivity = isScreenSizeSm ? 0.12 : 0.08;
                            rotation.set(rotation.get() + info.offset.x * sensitivity);
                          }
                        }}
                        onDragEnd={(_, info) => {
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); }
                          dragResetTimeoutRef.current = window.setTimeout(() => { 
                            isDraggingRef.current = false;
                            setActiveTouchCardIndex(null);
                          }, 100);
                          if (isCarouselActive) {
                            const velocity = info.velocity.x;
                            const velocityThreshold = 500;
                            
                            if (Math.abs(velocity) > velocityThreshold) {
                              const velocityMultiplier = isScreenSizeSm ? 0.03 : 0.025;
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
                        className={`group relative w-full aspect-square overflow-hidden rounded-xl shadow-lg transition-all duration-200 ${
                          activeTouchCardIndex === i 
                            ? 'ring-2 ring-vice-cyan shadow-[0_0_20px_#00ffff,0_0_40px_#00ffff60]' 
                            : 'ring-2 ring-vice-cyan/50'
                        }`}
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
                        onTouchStart={() => setActiveTouchCardIndex(i)}
                        onTouchEnd={() => setActiveTouchCardIndex(null)}
                        onMouseDown={() => setActiveTouchCardIndex(i)}
                        onMouseUp={() => setActiveTouchCardIndex(null)}
                        onDragStart={() => {
                          isDraggingRef.current = true;
                          setActiveTouchCardIndex(i);
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); dragResetTimeoutRef.current = null; }
                        }}
                        onDrag={(_, info) => {
                          if (isCarouselActive) {
                            // Reduced sensitivity for finer control and UI stability (second occurrence)
                            const sensitivity = isScreenSizeSm ? 0.12 : 0.08;
                            rotation.set(rotation.get() + info.offset.x * sensitivity);
                          }
                        }}
                        onDragEnd={(_, info) => {
                          if (dragResetTimeoutRef.current) { clearTimeout(dragResetTimeoutRef.current); }
                          dragResetTimeoutRef.current = window.setTimeout(() => { 
                            isDraggingRef.current = false;
                            setActiveTouchCardIndex(null);
                          }, 100);
                          if (isCarouselActive) {
                            const velocity = info.velocity.x;
                            const velocityThreshold = 500;
                            
                            if (Math.abs(velocity) > velocityThreshold) {
                              const velocityMultiplier = isScreenSizeSm ? 0.03 : 0.025;
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
                          onError={(e) => {
                            const url = e.currentTarget.src;
                            
                            // Fix double "public" path issue
                            if (url.includes('/public/public/')) {
                              const fixedUrl = url.replace('/public/public/', '/public/');
                              e.currentTarget.src = fixedUrl;
                            } else if (url.includes('/render/image/')) {
                              const fallback = url.replace('/render/image/', '/object/public/').split('?')[0];
                              e.currentTarget.src = fallback;
                            }
                          }}
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
        )}

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
              <div className="flex flex-col max-h-[80vh] sm:max-h-[70vh]">
                {/* Header with title, admin controls, and close button */}
                <div className="flex items-center justify-between border-b border-vice-cyan/30 p-4 sm:p-6 pb-3 flex-shrink-0">
                  <div>
                    <h3 className="text-xl font-bold text-white">Violation Details</h3>
                    <p className="text-sm text-vice-cyan/70">Unit {activeForm.unit_number}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Admin Controls - Only show for rob@ursllc.com on Admin page */}
                    {onDelete && user?.email === 'rob@ursllc.com' && (
                      <div className="flex items-center gap-2">
                        {/* Select Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedForDelete}
                            onChange={(e) => setSelectedForDelete(e.target.checked)}
                            className="w-4 h-4 rounded border-vice-cyan/30 bg-black/40 text-vice-pink focus:ring-vice-pink focus:ring-offset-0 focus:ring-2"
                          />
                          <span className="text-xs text-vice-cyan/80">Select</span>
                        </label>
                        
                        {/* Delete Button */}
                        <button
                          onClick={handleDelete}
                          disabled={!selectedForDelete}
                          className={`p-2 rounded-lg transition-colors ${
                            selectedForDelete 
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300' 
                              : 'bg-black/20 text-gray-500 cursor-not-allowed'
                          }`}
                          aria-label="Delete violation"
                          title={selectedForDelete ? "Delete this violation" : "Select violation first"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Close Button */}
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-vice-cyan/20 scrollbar-track-transparent">
                  {/* Loading Spinner - Shown during deletion */}
                  {isDeleting && (
                    <div className="flex flex-col items-center justify-center py-16 px-8">
                      <LoadingSpinner />
                      <p className="text-vice-cyan/80 text-sm mt-6 font-medium">
                        Deleting violation...
                      </p>
                    </div>
                  )}

                  {/* Expanded Image View - Centered below header */}
                  {!isDeleting && expandedImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative p-4 sm:p-6 flex items-center justify-center bg-black/60"
                    >
                      <div className="relative max-w-full">
                        <button
                          onClick={() => setExpandedImageUrl(null)}
                          className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-black/90 hover:bg-black text-white transition-colors shadow-lg"
                          aria-label="Close expanded image"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <img
                          src={getPhotoUrl(expandedImageUrl, 'expanded')}
                          alt="Expanded photo"
                          className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Details in specified order - Only show when no expanded image */}
                  {!isDeleting && !expandedImageUrl && (
                    <div className="p-4 sm:p-6 space-y-4">
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
                              src={getPhotoUrl(photo, 'expanded')}
                              alt={`Photo ${idx + 1}`}
                              loading="lazy"
                              className="w-full aspect-square object-cover rounded-lg ring-1 ring-vice-cyan/30 hover:ring-2 hover:ring-vice-pink transition-all cursor-pointer active:scale-95"
                              onClick={() => setExpandedImageUrl(photo)}
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
