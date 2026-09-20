'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type GlassDepth = 'strong' | 'mid' | 'light';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: GlassDepth;
  interactive?: boolean;
  className?: string;
}

const variantStyles: Record<GlassDepth, string> = {
  strong: 'glass-strong rounded-2xl',
  mid: 'glass-mid rounded-2xl',
  light: 'glass-light rounded-xl',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'mid', interactive = false, className = '', ...props }, ref) => {
    const baseClass = `${variantStyles[variant]} ${interactive ? 'glass-panel-hover cursor-pointer' : ''} ${className}`;

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className={baseClass}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClass} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
