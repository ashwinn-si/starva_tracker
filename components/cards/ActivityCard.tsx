'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistance, formatDuration, formatSpeed, formatPace } from '@/utils/formatters';
import { getSportMeta, getSportBadgeVariant } from '@/utils/sportConfig';
import { fmtActivityTimes } from '@/utils/timeUtils';
import { Badge } from '@/components/ui/Badge';
import { Heart, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface ActivityCardProps {
  activity: {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    elapsed_time?: number;
    start_date: string;
    start_date_local?: string;
    average_speed: number;
    elevation_gain?: number;
    average_heartrate?: number;
    max_heartrate?: number;
  };
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const meta = getSportMeta(activity.type);
  const Icon = meta.icon;
  const badgeVariant = getSportBadgeVariant(activity.type);

  const { localRange, istLabel, isIST } = fmtActivityTimes(
    activity.start_date,
    activity.start_date_local,
    activity.elapsed_time
  );

  const startDate = new Date(activity.start_date);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <Link href={`/activities/${activity.id}`}>
        <GlassCard
          variant="mid"
          className="p-5 cursor-pointer relative overflow-hidden pl-7 transition-all duration-200 group border hover:border-[#fc4c02]/40"
        >
          {/* Accent sport left rim */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1.5 opacity-90 transition-all duration-300 group-hover:w-2"
            style={{ background: meta.hex }}
          />

          {/* Ambient subtle backlight glow */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-2xl pointer-events-none"
            style={{ background: meta.hex }}
          />

          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className="p-2.5 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: `${meta.hex}18`,
                  border: `1px solid ${meta.hex}30`,
                  color: meta.hex,
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary tracking-tight group-hover:text-[#fc4c02] transition-colors leading-snug">
                  {activity.name}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {startDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'Asia/Kolkata',
                  })}
                </p>
                <p className="text-[11px] mt-0.5 font-mono tabular-nums" style={{ color: meta.hex, opacity: 0.9 }}>
                  {isIST ? `${localRange} IST` : <>{localRange} · {istLabel}</>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant}>{meta.label}</Badge>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm mt-3 pt-3 border-t border-border/60">
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Distance</p>
              <p className="font-mono font-bold text-text-primary text-base tracking-tight tabular-nums">
                {formatDistance(activity.distance)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Moving Time</p>
              <p className="font-mono font-bold text-text-primary text-base tracking-tight tabular-nums">
                {formatDuration(activity.moving_time)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">
                {meta.paceLabel}
              </p>
              <p className="font-mono font-bold text-text-primary text-base tracking-tight tabular-nums">
                {meta.usePace ? formatPace(activity.average_speed) : formatSpeed(activity.average_speed)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Elevation</p>
              <p className="font-mono font-bold text-text-primary text-base tracking-tight tabular-nums">
                {(activity.elevation_gain || 0).toFixed(0)} m
              </p>
            </div>
          </div>

          {(activity.average_heartrate || activity.max_heartrate) && (
            <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5" style={{ color: meta.hex }}>
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium text-[11px]">Heart Rate</span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-text-muted">
                {activity.average_heartrate && (
                  <span>
                    <strong className="text-text-primary font-semibold">{Math.round(activity.average_heartrate)}</strong> bpm avg
                  </span>
                )}
                {activity.max_heartrate && (
                  <span>
                    · <strong className="text-text-primary font-semibold">{Math.round(activity.max_heartrate)}</strong> bpm max
                  </span>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </Link>
    </motion.div>
  );
}
