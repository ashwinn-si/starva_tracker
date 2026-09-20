'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Ruler, Timer, Zap, Mountain, TrendingUp, ChevronRight } from 'lucide-react';
import useStravaStore from '@/store/useStravaStore';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';

interface ActivitySummary {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
  start_date: string;
  average_speed: number;
  max_speed: number;
}

interface PR {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  activityId: number;
  activityName: string;
  date: string;
}

function computePRs(activities: ActivitySummary[], type: string): PR[] {
  const meta = getSportMeta(type);
  const list = activities.filter((a) => a.type === type && a.distance > 0);
  if (list.length === 0) return [];

  const prs: PR[] = [];

  // Longest distance
  const longest = list.reduce((b, a) => (a.distance > b.distance ? a : b), list[0]);
  prs.push({
    label: 'Longest Distance',
    value: formatDistance(longest.distance),
    sub: formatDuration(longest.moving_time),
    icon: Ruler,
    activityId: longest.id,
    activityName: longest.name,
    date: longest.start_date,
  });

  // Best pace or speed — generic based on sport meta
  const fastest = list.reduce((b, a) => (a.average_speed > b.average_speed ? a : b), list[0]);
  if (fastest.average_speed > 0) {
    prs.push({
      label: meta.usePace ? 'Best Avg Pace' : 'Best Avg Speed',
      value: meta.usePace ? formatPace(fastest.average_speed) : formatSpeed(fastest.average_speed),
      sub: formatDistance(fastest.distance),
      icon: Zap,
      activityId: fastest.id,
      activityName: fastest.name,
      date: fastest.start_date,
    });
  }

  // Top speed (for non-pace sports)
  if (!meta.usePace) {
    const topSpeed = list.reduce((b, a) => (a.max_speed > b.max_speed ? a : b), list[0]);
    if (topSpeed.max_speed > 0) {
      prs.push({
        label: 'Top Speed',
        value: formatSpeed(topSpeed.max_speed),
        sub: formatDistance(topSpeed.distance),
        icon: Zap,
        activityId: topSpeed.id,
        activityName: topSpeed.name,
        date: topSpeed.start_date,
      });
    }
  }

  // Most elevation
  const hilliest = list.reduce((b, a) => (a.elevation_gain > b.elevation_gain ? a : b), list[0]);
  if (hilliest.elevation_gain > 0) {
    prs.push({
      label: 'Most Elevation',
      value: `${Math.round(hilliest.elevation_gain)} m`,
      sub: formatDistance(hilliest.distance),
      icon: Mountain,
      activityId: hilliest.id,
      activityName: hilliest.name,
      date: hilliest.start_date,
    });
  }

  // Longest duration
  const longestTime = list.reduce((b, a) => (a.moving_time > b.moving_time ? a : b), list[0]);
  prs.push({
    label: 'Longest Duration',
    value: formatDuration(longestTime.moving_time),
    sub: formatDistance(longestTime.distance),
    icon: Timer,
    activityId: longestTime.id,
    activityName: longestTime.name,
    date: longestTime.start_date,
  });

  return prs;
}

function PRCard({ pr, hex }: { pr: PR; hex: string }) {
  const Icon = pr.icon;
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
      <Link href={`/activities/${pr.activityId}`}>
        <GlassCard
          variant="mid"
          className="p-5 cursor-pointer h-full flex flex-col justify-between relative overflow-hidden group border hover:border-[#fc4c02]/40"
        >
          {/* Top specular glow line matching sport accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
            style={{ background: hex, opacity: 0.9 }}
          />

          {/* Ambient backlight */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-2xl pointer-events-none"
            style={{ background: hex }}
          />

          <div>
            <div className="flex items-start justify-between mb-3">
              <div
                className="p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-105"
                style={{
                  background: `${hex}18`,
                  border: `1px solid ${hex}30`,
                  color: hex,
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fc4c02]/10 border border-[#fc4c02]/20 text-[#fc4c02]">
                <Trophy className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">PR</span>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">
              {pr.label}
            </p>
            <p className="text-3xl font-mono font-bold text-text-primary tracking-tight tabular-nums">
              {pr.value}
            </p>
            <p className="text-xs text-text-secondary mt-1">{pr.sub}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs font-semibold text-text-primary truncate group-hover:text-[#fc4c02] transition-colors">
                {pr.activityName}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SportSummaryBar({ type, activities }: { type: string; activities: ActivitySummary[] }) {
  const list = activities.filter((a) => a.type === type);
  const totalDist = list.reduce((s, a) => s + a.distance, 0);
  const totalTime = list.reduce((s, a) => s + a.moving_time, 0);
  const totalElev = list.reduce((s, a) => s + a.elevation_gain, 0);
  return (
    <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-text-secondary font-mono tabular-nums">
      <span>
        <strong className="text-text-primary font-bold">{list.length}</strong> sessions
      </span>
      <span>
        <strong className="text-text-primary font-bold">{formatDistance(totalDist)}</strong> volume
      </span>
      <span>
        <strong className="text-text-primary font-bold">{formatDuration(totalTime)}</strong> moving
      </span>
      {totalElev > 0 && (
        <span>
          <strong className="text-text-primary font-bold">{Math.round(totalElev)} m</strong> climb
        </span>
      )}
    </div>
  );
}

const container = { animate: { transition: { staggerChildren: 0.07 } } };
const itemV = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function RecordsPage() {
  const { activities, loading, fetchAll } = useStravaStore();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (activities.length === 0) fetchAll();
  }, [activities.length, fetchAll]);

  const sportTypes = useMemo(
    () => [...new Set(activities.map((a) => a.type))].sort(),
    [activities]
  );

  const activeSport = activeTab ?? sportTypes[0] ?? '';
  const meta = getSportMeta(activeSport);
  const Icon = meta.icon;
  const prs = useMemo(
    () => computePRs(activities as ActivitySummary[], activeSport),
    [activities, activeSport]
  );

  return (
    <main className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        {/* Header with Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#fc4c02] shadow-[0_0_8px_#fc4c02]" />
            <span className="text-xs uppercase font-bold tracking-wider text-[#fc4c02]">
              Hall of Fame
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Personal Records</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            All-time benchmark efforts achieved across your training history.
          </p>
        </motion.div>

        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-14 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {!loading && sportTypes.length === 0 && (
          <GlassCard variant="mid" className="p-12 text-center text-text-secondary">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#fc4c02]" />
            <p className="font-semibold text-lg">No activities found</p>
            <p className="text-sm text-text-muted mt-1">Log activities to establish personal records</p>
          </GlassCard>
        )}

        {!loading && sportTypes.length > 0 && (
          <>
            {/* Sport Tabs in GlassCard */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <GlassCard variant="strong" className="p-3 sm:p-4 flex flex-wrap gap-2">
                {sportTypes.map((type) => {
                  const m = getSportMeta(type);
                  const SIcon = m.icon;
                  const count = activities.filter((a) => a.type === type).length;
                  const isSelected = activeSport === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveTab(type)}
                      className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#fc4c02] text-white shadow-[0_0_16px_rgba(252,76,2,0.35)]'
                          : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                      }`}
                      style={
                        isSelected
                          ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 0 4px 14px rgba(252, 76, 2, 0.35)' }
                          : undefined
                      }
                    >
                      <SIcon className="w-4 h-4" />
                      <span>{m.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-white/10 text-text-muted'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </GlassCard>
            </motion.div>

            {/* Active Sport Overview Bar */}
            <motion.div
              key={activeSport + '-summary'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <GlassCard variant="mid" className="p-5 flex items-center gap-4">
                <div
                  className="p-3 rounded-xl flex-shrink-0"
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
                  <p className="font-bold text-sm text-text-primary mb-1">
                    {meta.label} Historical Overview
                  </p>
                  <SportSummaryBar type={activeSport} activities={activities as ActivitySummary[]} />
                </div>
              </GlassCard>
            </motion.div>

            {/* PR Grid */}
            {prs.length > 0 ? (
              <motion.div
                key={activeSport + '-prs'}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={container}
                initial="initial"
                animate="animate"
              >
                {prs.map((pr) => (
                  <motion.div key={pr.label} variants={itemV}>
                    <PRCard pr={pr} hex={meta.hex} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <GlassCard variant="mid" className="p-12 text-center text-text-secondary">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#fc4c02]" />
                <p className="font-semibold text-lg">No records for {meta.label}</p>
                <p className="text-sm text-text-muted mt-1">Complete a {meta.label.toLowerCase()} activity to establish your first PR</p>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </main>
  );
}
