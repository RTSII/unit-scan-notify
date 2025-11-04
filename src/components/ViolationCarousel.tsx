import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";
import { X, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, User } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DeleteSphereSpinner from "./ui/delete-sphere-spinner";

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
  // Deduplicate forms by ID to ensure each violation only appears once
  // even if the same form appears multiple times in the input array
  const uniqueForms = Array.from(
    new Map((forms || []).map(form => [form.id, form])).values()
  );
  
  return uniqueForms.map((form, index) => {
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
    // Only use the FIRST photo for the carousel thumbnail
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
  // Remove complex drag handling - use simple 21st.dev pattern

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
  
  // Fixed sizing to maintain proper 3D structure
  const circumference = cylinderWidth;
  const radius = cylinderWidth / (2 * Math.PI);
  
  // Reduce face width to create gaps for 3D effect (like 21st.dev)
  const faceWidth = (cylinderWidth / faceCount) * 0.85; // 85% to create gaps between cards

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
    
    // Normalize current rotation to -180 to 180 range
    let normalized = currentRotation % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    
    // Find nearest card
    const nearestCardIndex = Math.round(normalized / degreesPerCard);
    const targetRotation = nearestCardIndex * degreesPerCard;
    
    // Calculate shortest path
    let delta = targetRotation - normalized;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    const finalRotation = normalized + delta;
    
    controls.start({
      rotateY: finalRotation,
      transition: { 
        type: "spring", 
        stiffness: 200, // Slightly softer for smoother snap
        damping: 30, 
        mass: 0.2
      }
    }).then(() => {
      // Lock rotation to exact value after snap
      rotation.set(finalRotation);
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
        // Wait a brief moment to show completion before closing
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsDeleting(false);
        handleClose();
      } catch (error) {
        // If delete fails, reset state but keep popover open to show error
        setIsDeleting(false);
        console.error('Delete failed:', error);
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
              perspective: isScreenSizeSm ? "600px" : "800px", // Stronger 3D effect on mobile
              perspectiveOrigin: "50% 50%",
              transformStyle: "preserve-3d",
              willChange: "transform",
              touchAction: 'pan-y'
            }}
          >
            <motion.div
              drag={isCarouselActive ? "x" : false}
              className="relative flex h-full origin-center justify-center select-none cursor-grab active:cursor-grabbing"
              style={{ 
                transform, 
                rotateY: rotation, 
                width: cylinderWidth, 
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                willChange: 'transform',
                touchAction: 'pan-y'
              }}
              onDragStart={() => {
                isDraggingRef.current = true;
              }}
              onDrag={(_, info) => {
                if (isCarouselActive) {
                  // Ultra-conservative sensitivity for iPhone stability
                  const sensitivity = isScreenSizeSm ? 0.025 : 0.05; // Half sensitivity on mobile
                  rotation.set(rotation.get() + info.offset.x * sensitivity);
                }
              }}
              onDragEnd={(_, info) => {
                if (isCarouselActive) {
                  // More conservative momentum for iPhone
                  const momentum = isScreenSizeSm ? 0.025 : 0.05; // Half momentum on mobile
                  controls.start({
                    rotateY: rotation.get() + info.velocity.x * momentum,
                    transition: {
                      type: "spring",
                      stiffness: isScreenSizeSm ? 150 : 100, // Stiffer on mobile for quicker settle
                      damping: isScreenSizeSm ? 40 : 30, // More damping on mobile
                      mass: 0.1,
                    },
                  });
                }
                // Reset drag state after a small delay
                setTimeout(() => {
                  isDraggingRef.current = false;
                }, 100);
              }}
              animate={controls}
            >
              {displayItems.map((item, i) => {
                const baseAngle = i * (360 / faceCount);
                const cardAngle = (baseAngle + rotDeg) % 360;
                const normalizedAngle = ((cardAngle + 180) % 360) - 180;
                const isInFront = Math.abs(normalizedAngle) < 90;
                const depth = Math.cos((normalizedAngle * Math.PI) / 180);
                
                return (
                  <motion.div 
                    key={`key-${item.imageUrl}-${i}`}
                    data-card-index={i}
                    className="absolute flex h-full origin-center items-center justify-center p-2"
                    style={{
                      width: `${faceWidth}px`,
                      transform: `rotateY(${baseAngle}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'visible', // Show back cards for 3D effect
                      WebkitBackfaceVisibility: 'visible',
                      opacity: isInFront ? 1 : Math.max(0.5, 0.6 + depth * 0.4), // Higher opacity for back cards
                      filter: isInFront ? 'none' : `brightness(${0.8 + depth * 0.15})`, // Less darkening for visibility
                      zIndex: Math.round(50 + depth * 50), // Depth-based layering
                      pointerEvents: isInFront ? 'auto' : 'none'
                    }}
                    onClick={() => {
                      if (isDraggingRef.current || !isInFront) return;
                      handleClick(item.fullForm);
                    }}
                  >
                    {item.imageUrl === "placeholder" ? (
                      <div 
                        className={`relative w-full rounded-xl bg-black/90 aspect-square shadow-lg transition-all duration-200 ${
                          isInFront 
                            ? (activeTouchCardIndex === i 
                                ? 'ring-2 ring-vice-cyan shadow-[0_0_20px_#00ffff,0_0_40px_#00ffff60]' 
                                : 'ring-1 ring-vice-cyan/50')
                            : 'ring-1 ring-vice-cyan/30' // Brighter rings for back cards visibility
                        }`}
                        style={{ 
                          pointerEvents: 'none',
                          transform: `scale(${isInFront ? 1 : 0.95 + depth * 0.05})` // Slight scaling for depth
                        }}
                      />
                    ) : (
                      <div 
                        className={`group relative w-full aspect-square overflow-hidden rounded-xl shadow-lg transition-all duration-200 ${
                          isInFront 
                            ? (activeTouchCardIndex === i 
                                ? 'ring-2 ring-vice-cyan shadow-[0_0_20px_#00ffff,0_0_40px_#00ffff60]' 
                                : 'ring-2 ring-vice-cyan/50')
                            : 'ring-1 ring-vice-cyan/30' // Brighter rings for back cards visibility
                        }`}
                        style={{ 
                          backgroundColor: '#0a0a0a',
                          pointerEvents: 'none',
                          transform: `scale(${isInFront ? 1 : 0.95 + depth * 0.05})` // Slight scaling for depth
                        }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`${item.unit} ${item.date}`}
                          className="absolute inset-0 w-full h-full object-cover touch-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                          style={{ 
                            opacity: isInFront ? 1 : 0.85 + depth * 0.1 // Less fading for back card visibility
                          }}
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
                            <div 
                              className={`text-[10px] sm:text-xs font-medium drop-shadow-[0_0_10px_#ff1493] backdrop-blur-md px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap shadow-xl ${
                                isInFront 
                                  ? 'text-vice-pink bg-black/40 ring-1 ring-vice-cyan/40'
                                  : 'text-vice-pink/80 bg-black/50 ring-1 ring-vice-cyan/30' // Brighter for back cards
                              }`}
                              style={{
                                opacity: isInFront ? 1 : 0.8 + depth * 0.15 // Higher badge opacity for back cards
                              }}
                            >
                              {item.unit && <span className="font-semibold">{item.unit}</span>}
                              {item.unit && item.date && <span className="mx-1.5 opacity-60">•</span>}
                              {item.date && <span>{item.date}</span>}
                            </div>
                          </div>
                        )}
                      </div>
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
            <>
              {/* Enhanced Backdrop - Click outside to close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
                onClick={handleClose}
                style={{ 
                  touchAction: 'auto',
                  WebkitBackdropFilter: 'blur(8px)',
                  backdropFilter: 'blur(8px)'
                }}
              />
              
              {/* Enhanced Mobile-Responsive Overlay Card */}
              <div 
                className="fixed inset-0 flex items-start justify-center z-50 p-2 sm:p-4 pt-[80px] sm:pt-[84px] pointer-events-none safe-area-inset-top"
                style={{ touchAction: 'auto' }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <motion.div
                  ref={popoverRef}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="w-full max-w-2xl max-h-[calc(90vh-80px)] sm:max-h-[calc(85vh-84px)] p-0 bg-gradient-to-br from-vice-purple/98 via-black/98 to-vice-blue/98 border-2 border-vice-cyan/80 backdrop-blur-xl rounded-2xl shadow-2xl pointer-events-auto overflow-hidden ring-1 ring-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
              <div className="flex flex-col h-full">
                {/* Enhanced Header with better mobile spacing */}
                <div className="flex items-center justify-between border-b border-vice-cyan/30 bg-black/20 p-3 sm:p-6 pb-3 flex-shrink-0">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Violation Details</h3>
                    <p className="text-sm text-vice-cyan/80">Unit {activeForm.unit_number}</p>
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

                {/* Enhanced Scrollable Content Area with better mobile spacing */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-vice-cyan/30 scrollbar-track-black/20 bg-black/10">
                  {/* Delete Sphere Spinner - Shown during deletion */}
                  {isDeleting && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center py-20 px-8 min-h-[350px] overflow-hidden"
                    >
                      <DeleteSphereSpinner />
                      <p className="text-vice-cyan/80 text-sm mt-8 font-medium">
                        Deleting violation...
                      </p>
                    </motion.div>
                  )}

                  {/* Expanded Image View - Centered below header with top layer z-index */}
                  {!isDeleting && expandedImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg p-2 sm:p-4"
                      onClick={() => setExpandedImageUrl(null)}
                    >
                      <div className="relative max-w-full max-h-full">
                        <button
                          onClick={() => setExpandedImageUrl(null)}
                          className="absolute -top-2 -right-2 z-[110] p-2 sm:p-3 rounded-full bg-black/90 hover:bg-black text-white transition-colors shadow-lg border border-vice-cyan/50 backdrop-blur-md"
                          aria-label="Close expanded image"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <img
                          src={getPhotoUrl(expandedImageUrl, 'full')}
                          alt="Expanded photo"
                          className="max-w-[95vw] max-h-[90vh] sm:max-w-full sm:max-h-[85vh] object-contain rounded-lg shadow-2xl ring-2 ring-vice-cyan/60"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Details with better mobile spacing */}
                  {!isDeleting && !expandedImageUrl && (
                    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                          {activeForm.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="relative group cursor-pointer"
                              onClick={() => setExpandedImageUrl(photo)}
                            >
                              <img
                                src={getPhotoUrl(photo, 'expanded')}
                                alt={`Photo ${idx + 1}`}
                                loading="lazy"
                                className="w-full aspect-square object-cover rounded-lg ring-1 ring-vice-cyan/40 hover:ring-2 hover:ring-vice-pink transition-all active:scale-95 group-hover:brightness-110"
                              />
                              {/* Expand indicator */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-vice-cyan/80 flex items-center justify-center">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
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
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
