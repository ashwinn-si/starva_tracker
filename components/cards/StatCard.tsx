'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  unit?: string;
  sublabel?: string;
}

export function StatCard({ label, value, icon, unit, sublabel }: StatCardProps) {
  return (
    <GlassCard
      variant="mid"
      interactive
      className="p-5 h-32 flex flex-col justify-between relative overflow-hidden group select-none"
    >
      {/* Subtle orange accent glow on hover */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#fc4c02]/0 group-hover:bg-[#fc4c02]/10 blur-2xl transition-all duration-500 rounded-full pointer-events-none" />

      <div className="flex items-center justify-between w-full relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          {label}
        </p>
        {icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#fc4c02]/10 border border-[#fc4c02]/20 text-[#fc4c02] shadow-[0_0_12px_rgba(252,76,2,0.12)] group-hover:scale-105 transition-transform"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)' }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col relative z-10 mt-auto">
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-bold font-mono text-text-primary tracking-tight tabular-nums">
            {value}
          </p>
          {unit && (
            <span className="text-xs font-semibold text-text-secondary">{unit}</span>
          )}
        </div>
        {sublabel && (
          <p className="text-[11px] text-text-muted mt-0.5 truncate">{sublabel}</p>
        )}
      </div>
    </GlassCard>
  );
}
