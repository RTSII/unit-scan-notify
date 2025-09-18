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

    // Effect for auto-rotation when not scrolling
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) {
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
    }, [isScrolling, autoRotateSpeed]);

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center", className)}
        style={{ perspective: '2000px' }}
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
              return (
                <div
                  key={`${item.photo.url}-${i}`}
                  role="group"
                  aria-label={item.common}
                  className="absolute w-[300px] h-[400px]"
                  style={{
                    transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)` ,
                    left: '50%',
                    top: '50%',
                    marginLeft: '-150px',
                    marginTop: '-200px',
                    opacity: opacity,
                    transition: 'opacity 0.3s linear'
                  }}
                >
                  <div className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden group border border-border bg-card/70 dark:bg-card/30 backdrop-blur-lg">
                    <img
                      src={item.photo.url}
                      alt={item.photo.text}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: item.photo.pos || 'center' }}
                    />
                    {/* Replaced text-primary-foreground with text-white for consistent color */}
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <h2 className="text-xl font-bold">{item.common}</h2>
                      <em className="text-sm italic opacity-80">{item.binomial}</em>
                      <p className="text-xs mt-2 opacity-70">Photo by: {item.photo.by}</p>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
