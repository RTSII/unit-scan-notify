import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string; 
    text: string;
    pos?: string;
    by: string;
  };
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    // Visual geometry constants and dynamic container measurement
    const PERSPECTIVE = 2000; // must match the perspective style applied below
    const ASPECT_RATIO = 260 / 340; // keep same card aspect ratio as before
    const VERTICAL_PADDING = 24; // px of headroom to avoid touching edges
    const [containerHeight, setContainerHeight] = useState(0);

    // Effect to handle scroll-based rotation
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        const scrollRotation = scrollProgress * 360;
        setRotation(scrollRotation);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // Measure the dark-grey container height to size faces safely
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const update = () => setContainerHeight(el.clientHeight || 0);
      update();
      let ro: ResizeObserver | null = null;
      const win: any = typeof window !== 'undefined' ? window : null;
      if (win && 'ResizeObserver' in win) {
        ro = new ResizeObserver(() => update());
        ro.observe(el);
      } else if (win) {
        win.addEventListener?.('resize', update);
      }
      return () => {
        if (ro) ro.disconnect();
        else win?.removeEventListener?.('resize', update);
      };
    }, []);

    // Effect for auto-rotation when not scrolling, not hovered, and no modal open
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling && !isHovered && activeIndex === null) {
          setRotation(prev => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isScrolling, autoRotateSpeed, isHovered, activeIndex]);

    // Enable mouse wheel rotation when hovering the gallery
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        setIsScrolling(true);
        setRotation(prev => prev + e.deltaY * 0.2);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Close modal on ESC
    useEffect(() => {
      if (activeIndex === null) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveIndex(null);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [activeIndex]);

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref && typeof ref === 'object') (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center", className)}
        style={{ perspective: `${PERSPECTIVE}px` }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)` ,
            transformStyle: 'preserve-3d',
          }}
        >
          {(() => {
            // Compute a base face size that ensures the front-most apparent height never exceeds container
            const factorFront = PERSPECTIVE / (PERSPECTIVE - radius);
            const maxApparent = Math.max(0, containerHeight - VERTICAL_PADDING);
            const baseCardHeight = containerHeight
              ? Math.max(140, Math.floor(maxApparent / factorFront))
              : 240; // fallback before measurement
            const baseCardWidth = Math.floor(baseCardHeight * ASPECT_RATIO);

            const fallbackItems: GalleryItem[] = [
              { common: 'Sample One', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1541707519942-08fd2f6480ba?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Two', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Three', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1662841238473-f4b137e123cb?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Four', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1589648751789-c8ecb7a88bd5?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Five', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1659540181281-1d89d6112832?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Six', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1595792419466-23cec2476fa6?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Seven', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1689799513565-44d2bc09d75b?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
              { common: 'Sample Eight', binomial: 'Placeholder', photo: { url: 'https://images.unsplash.com/photo-1619664208054-41eefeab29e9?q=80&w=900&auto=format&fit=crop', text: 'placeholder', by: 'Unsplash' } },
            ];
            const safeItems = items && items.length > 0 ? items : fallbackItems;
            const angle = 360 / safeItems.length;
            return safeItems.map((item, i) => {
              const itemAngle = i * angle;
              const totalRotation = rotation % 360;
              const relativeAngle = (itemAngle + totalRotation + 360) % 360;
              const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
              const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));
              const scale = 0.8 + (1 - (normalizedAngle / 180)) * 0.2; // ~25% larger at front vs back
              return (
                <div
                  key={`${item.photo.url}-${i}`}
                  role="group"
                  aria-label={item.common}
                  className="absolute"
                  style={{
                    width: `${baseCardWidth}px`,
                    height: `${baseCardHeight}px`,
                    transform: `rotateY(${itemAngle}deg) translateZ(${radius}px) scale(${scale})` ,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${Math.floor(baseCardWidth / 2)}px`,
                    marginTop: `-${Math.floor(baseCardHeight / 2)}px`,
                    opacity: opacity,
                    transition: 'opacity 0.3s linear'
                  }}
                  onClick={() => setActiveIndex(i)}
                >
                  <div className="relative w-full h-full rounded-lg overflow-hidden group border border-vice-cyan/20 bg-black/60">
                    {/* Solid black placeholder with neon glow */}
                    <div className="absolute inset-3 rounded-2xl bg-black/80 ring-1 ring-vice-pink/50 shadow-[0_0_6px_#ff149380,0_0_10px_#00ffff60]" />
                    {/* Labels: Date (top), Unit (bottom) using Vice cyan */}
                    <div className="absolute inset-x-4 bottom-3 flex flex-col items-start gap-0.5 pointer-events-none">
                      <span className="text-sm font-semibold text-vice-cyan drop-shadow-[0_0_2px_#00ffff]">{item.binomial}</span>
                      <span className="text-xs text-vice-cyan/90 drop-shadow-[0_0_2px_#00ffff]">Unit {item.common}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
        {activeIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setActiveIndex(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl border border-vice-cyan/30 bg-black/80 p-6 shadow-[0_0_12px_#00ffff50,0_0_18px_#ff149350]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Violation Details</h3>
                <button
                  onClick={() => setActiveIndex(null)}
                  className="text-vice-cyan hover:text-white transition-colors"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {(() => {
                const safe = (items && items.length > 0) ? items : [
                  { common: '—', binomial: '—', photo: { url: '', text: '', by: '' } },
                ];
                const cur = safe[activeIndex!];
                return (
                  <div className="space-y-3 text-white">
                    <div className="text-sm text-vice-cyan">Date: {cur?.binomial || '—'}</div>
                    <div className="text-sm text-vice-cyan/90">Unit: {cur?.common || '—'}</div>
                    {cur?.photo?.by && <div className="text-sm text-gray-300">By: {cur.photo.by}</div>}
                    <p className="text-sm text-gray-300">Press ESC or click outside to return.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
