import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useMediaQuery } from "./ui/3d-carousel";

export interface FormLike {
  id: string;
  unit_number: string;
  date: string; // ISO or parseable date
  photos: string[];
}

export type CarouselItem = {
  id: string;
  imageUrl: string;
  unit: string;
  date: string; // already formatted string
};

export function mapFormsToCarouselItems(forms: FormLike[]): CarouselItem[] {
  return (forms || []).map((form, index) => ({
    id: form.id,
    imageUrl: form.photos?.[0] || `https://picsum.photos/400/400?violation-${index}`,
    date: new Date(form.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    unit: form.unit_number,
  }));
}

export const ViolationCarousel3D: React.FC<{ forms: FormLike[] }> = ({ forms }) => {
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const controls = useAnimation();
  const isScreenSizeSm = useMediaQuery("(max-width: 640px)");

  const baseItems = useMemo(() => {
    const items = mapFormsToCarouselItems(forms);
    return items.length > 0 ? items : [{ id: "placeholder-1", imageUrl: "placeholder", unit: "", date: "" }];
  }, [forms]);

  const targetFaces = isScreenSizeSm ? 16 : 22;
  const cylinderWidth = isScreenSizeSm ? 1100 : 1800;
  const maxThumb = isScreenSizeSm ? 64 : 80; // Back to original size

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
      setActiveImg(imgUrl);
      setActiveIndex(index);
      setIsCarouselActive(false);
      controls.stop();
    }
  };

  const handleClose = () => {
    setActiveImg(null);
    setActiveIndex(null);
    setIsCarouselActive(true);
  };

  return (
    <div className="w-full">
      <motion.div layout className="relative">
        <AnimatePresence mode="sync">
          {activeImg && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              layoutId={`img-container-${activeImg}`}
              layout="position"
              onClick={handleClose}
              className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 m-5 md:m-36 lg:mx-[19rem] rounded-3xl"
              style={{ willChange: "opacity" }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <motion.img
                layoutId={`img-${activeImg}-${activeIndex}`}
                src={activeImg}
                className="max-w-full max-h-full rounded-lg shadow-lg"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ willChange: "transform" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative h-[160px] w-full overflow-hidden rounded-xl bg-black/20 py-3">
          <div
            className="flex h-full items-center justify-center bg-black/10"
            style={{ perspective: "1000px", transformStyle: "preserve-3d", willChange: "transform" }}
          >
            <motion.div
              drag={isCarouselActive ? "x" : false}
              className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
              style={{ transform, rotateY: rotation, width: cylinderWidth, transformStyle: "preserve-3d" }}
              onDrag={(_, info) => isCarouselActive && rotation.set(rotation.get() + info.offset.x * 0.05)}
              onDragEnd={(_, info) =>
                isCarouselActive &&
                controls.start({ 
                  rotateY: rotation.get() + info.velocity.x * 0.1, 
                  transition: { type: "spring", stiffness: 100, damping: 30, mass: 0.1 } 
                })
              }
              animate={controls}
            >
              {displayItems.map((item, i) => (
                <motion.div
                  key={`key-${item.imageUrl}-${i}`}
                  className="absolute flex h-full origin-center items-center justify-center rounded-2xl p-0.5 sm:p-1"
                  style={{ width: `${faceWidth}px`, transform: `rotateY(${i * (360 / faceCount)}deg) translateZ(${radius}px)` }}
                  onClick={() => handleClick(item.imageUrl, i)}
                >
                  {item.imageUrl === "placeholder" ? (
                    <div className="relative w-full rounded-2xl bg-gray-800 ring-2 ring-vice-pink/60 shadow-[0_0_8px_#ff149360,0_0_16px_#ff149340] aspect-square">
                      {/* Neon pink overlay for placeholder */}
                      <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5">
                        <div className="text-[10px] sm:text-xs text-vice-cyan/90 drop-shadow-[0_0_2px_#00ffff]">
                          {item.date}
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-vice-cyan drop-shadow-[0_0_2px_#00ffff]">
                          {item.unit}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-square">
                      <motion.img
                        src={item.imageUrl}
                        alt={`${item.unit} ${item.date}`}
                        layoutId={`img-${item.imageUrl}-${i}`}
                        className="pointer-events-none w-full rounded-2xl object-cover aspect-square ring-2 ring-vice-pink/60 shadow-[0_0_8px_#ff149360,0_0_16px_#ff149340]"
                        initial={{ filter: "blur(4px)" }}
                        layout="position"
                        animate={{ filter: "blur(0px)" }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                      />
                      {/* Neon cyan overlay - contained within thumbnail */}
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5">
                        <div className="text-xs text-vice-cyan/90 drop-shadow-[0_0_2px_#00ffff] font-medium">
                          {item.date}
                        </div>
                        <div className="text-xs font-semibold text-vice-cyan drop-shadow-[0_0_2px_#00ffff]">
                          {item.unit}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
