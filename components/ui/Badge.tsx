import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'run' | 'ride' | 'walk' | 'pr';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-white/5 text-text-secondary border-border',
    run: 'bg-[#fc4c02]/15 text-[#fc4c02] border-[#fc4c02]/30 shadow-[0_0_12px_rgba(252,76,2,0.12)]',
    ride: 'bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30 shadow-[0_0_12px_rgba(249,115,22,0.12)]',
    walk: 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 shadow-[0_0_12px_rgba(245,158,11,0.12)]',
    pr: 'bg-gradient-to-r from-[#fc4c02]/20 to-[#f97316]/20 text-[#fb923c] border-[#fb923c]/35 shadow-[0_0_14px_rgba(251,146,60,0.18)]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border shadow-sm backdrop-blur-md ${variants[variant]} ${className}`}
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
      }}
    >
      {children}
    </span>
  );
}
