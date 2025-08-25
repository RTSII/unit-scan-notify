import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DockItemData {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
}

interface DockItemProps {
  item: DockItemData;
  mouseX: any;
  distance: number;
  baseItemSize: number;
  magnification: number;
}

const DockItem: React.FC<DockItemProps> = ({
  item,
  mouseX,
  distance,
  baseItemSize,
  magnification,
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );

  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width }}
      className={cn(
        'aspect-square rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-colors hover:bg-white/30',
        item.className
      )}
      onClick={item.onClick}
      whileTap={{ scale: 0.95 }}
    >
      {item.icon}
    </motion.button>
  );
};

export const Dock: React.FC<DockProps> = ({
  items,
  className,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
  dockHeight = 256,
  magnification = 70,
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
        className
      )}
      style={{ height: dockHeight }}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          'flex h-full items-end justify-center gap-4 rounded-2xl bg-gray-950/10 backdrop-blur-md border border-white/20 px-4 pb-3'
        )}
        style={{ height: panelHeight }}
      >
        {items.map((item, i) => (
          <DockItem
            key={i}
            item={item}
            mouseX={mouseX}
            distance={distance}
            baseItemSize={baseItemSize}
            magnification={magnification}
          />
        ))}
      </motion.div>
    </div>
  );
};