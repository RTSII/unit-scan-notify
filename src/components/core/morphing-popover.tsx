'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MorphingPopover = PopoverPrimitive.Root;

const MorphingPopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> & {
    transition?: any;
  }
>(({ className, transition, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
MorphingPopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

const MorphingPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    transition?: any;
  }
>(({ className, align = 'center', sideOffset = 4, side = 'bottom', avoidCollisions = true, collisionPadding = 16, sticky = 'always', transition, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      side={side}
      align={align}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      sticky={sticky}
      className={cn(className)}
      asChild
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={transition || {
          type: 'spring',
          bounce: 0.05,
          duration: 0.3,
        }}
      >
        {props.children}
      </motion.div>
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
MorphingPopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };