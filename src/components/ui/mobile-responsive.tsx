import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
  withSafeArea?: boolean;
}

export const MobileContainer = ({
  children,
  className,
  fullHeight = true,
  withSafeArea = true
}: MobileContainerProps) => {
  return (
    <div
      className={cn(
        'w-full mx-auto max-w-md',
        fullHeight && 'min-h-screen-mobile',
        withSafeArea && 'p-safe',
        className
      )}
    >
      {children}
    </div>
  );
};

interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const TouchButton = ({
  children,
  onClick,
  className,
  disabled = false,
  size = 'md',
  variant = 'primary'
}: TouchButtonProps) => {
  const sizeClasses = {
    sm: 'touch-target text-sm',
    md: 'touch-target-lg text-base',
    lg: 'w-16 h-16 xs:w-20 xs:h-20 text-lg'
  };

  const variantClasses = {
    primary: 'bg-vice-purple hover:bg-vice-purple/80 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-full flex items-center justify-center shadow-lg transform transition-all',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'no-select',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

interface ResponsiveTextProps {
  children: ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

export const ResponsiveText = ({
  children,
  className,
  size = 'base'
}: ResponsiveTextProps) => {
  const sizeClasses = {
    xs: 'text-xs xs:text-sm',
    sm: 'text-sm xs:text-base',
    base: 'text-base xs:text-lg',
    lg: 'text-lg xs:text-xl',
    xl: 'text-xl xs:text-2xl'
  };

  return (
    <span className={cn(sizeClasses[size], className)}>
      {children}
    </span>
  );
};