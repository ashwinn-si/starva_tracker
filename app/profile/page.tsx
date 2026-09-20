'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import useStravaStore from '@/store/useStravaStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { getSportMeta } from '@/utils/sportConfig';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { MapPin, Calendar, Award, Zap, TrendingUp, Trophy, Sparkles } from 'lucide-react';

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function StatTile({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <GlassCard variant="mid" className="p-4 flex flex-col gap-1 relative overflow-hidden group">
      {highlight && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#fc4c02]/10 rounded-full blur-xl pointer-events-none" />
      )}
      <p className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">
        {label}
      </p>
      <p className="text-2xl font-bold font-mono text-text-primary tracking-tight tabular-nums">
        {value}
      </p>
      {sub && <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>}
    </GlassCard>
  );
}

export default function ProfilePage() {
  const { athlete, activities, stats, loading, fetchAll } = useStravaStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sportSummary = useMemo(() => {
    const map: Record<string, { count: number; distance: number; time: number }> = {};
    for (const a of activities) {
      if (!map[a.type]) map[a.type] = { count: 0, distance: 0, time: 0 };
      map[a.type].count++;
      map[a.type].distance += a.distance ?? 0;
      map[a.type].time += a.moving_time ?? 0;
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [activities]);

  const memberSince = athlete?.created_at
    ? new Date(athlete.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const totalTime = activities.reduce((s, a) => s + (a.moving_time ?? 0), 0);
  const totalDist = activities.reduce((s, a) => s + (a.distance ?? 0), 0);

  if (loading && !athlete) {
    return (
      <main className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8 space-y-6">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8 space-y-6 w-full">
        {/* Profile Hero with Quiet Luxury Glass Depth */}
        <motion.div variants={item} initial="initial" animate="animate">
          <GlassCard variant="strong" className="p-6 sm:p-8 relative overflow-hidden">
            {/* Ambient orange bloom */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#fc4c02]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-6 flex-wrap relative z-10">
              {/* Avatar with Specular Highlight Ring */}
              <div className="relative flex-shrink-0">
                {athlete?.profile && athlete.profile.startsWith('https') ? (
                  <Image
                    src={athlete.profile}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#fc4c02]/40 shadow-[0_0_20px_rgba(252,76,2,0.2)]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white select-none ring-2 ring-[#fc4c02]/40 shadow-[0_0_20px_rgba(252,76,2,0.2)]"
                  style={{
                    background: 'linear-gradient(135deg, #fc4c02 0%, #f97316 100%)',
                    position: athlete?.profile?.startsWith('http') ? 'absolute' : 'relative',
                    inset: 0,
                    zIndex: -1,
                  }}
                >
                  {athlete
                    ? `${athlete.firstname?.[0] ?? ''}${athlete.lastname?.[0] ?? ''}`.toUpperCase() || '?'
                    : '?'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--background)] shadow-[0_0_8px_#10b981]" />
              </div>

              {/* Name & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#fc4c02] shadow-[0_0_8px_#fc4c02]" />
                  <span className="text-xs uppercase font-bold tracking-wider text-[#fc4c02]">
                    Strava Athlete
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 truncate">
                  {athlete ? `${athlete.firstname} ${athlete.lastname}` : 'Athlete'}
                </h1>
                <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                  {(athlete?.city || athlete?.state) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#fc4c02]" />
                      {[athlete.city, athlete.state, athlete.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {memberSince && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      Member since {memberSince}
                    </span>
                  )}
                </div>

                {/* Lifetime Stats Quick Strip */}
                <div className="mt-6 pt-5 border-t border-border/60 flex flex-wrap gap-6 sm:gap-8 font-mono tabular-nums">
                  {[
                    { label: 'Activities Logged', value: activities.length },
                    { label: 'Lifetime Distance', value: formatDistance(totalDist) },
                    { label: 'Lifetime Time', value: formatDuration(totalTime) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xl font-bold text-text-primary tracking-tight">{value}</p>
                      <p className="text-[10px] text-text-muted uppercase font-sans font-bold tracking-wider mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Year to Date Section */}
        {stats && (
          <motion.div variants={item} initial="initial" animate="animate">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#fc4c02]" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">
                Year to Date
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Ride Distance"
                value={formatDistance(stats.ytd_ride_totals.distance)}
                sub={`${stats.ytd_ride_totals.count} rides`}
                highlight
              />
              <StatTile
                label="Ride Time"
                value={formatDuration(stats.ytd_ride_totals.moving_time)}
              />
              <StatTile
                label="Run Distance"
                value={formatDistance(stats.ytd_run_totals.distance)}
                sub={`${stats.ytd_run_totals.count} runs`}
                highlight
              />
              <StatTile
                label="Run Time"
                value={formatDuration(stats.ytd_run_totals.moving_time)}
              />
            </div>
          </motion.div>
        )}

        {/* All-Time Bests */}
        {stats && (
          <motion.div variants={item} initial="initial" animate="animate">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#fc4c02]" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">
                All-Time Bests
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Longest Ride"
                value={stats.biggest_ride_distance ? formatDistance(stats.biggest_ride_distance) : '—'}
              />
              <StatTile
                label="Longest Run"
                value={stats.longest_run_distance ? formatDistance(stats.longest_run_distance) : '—'}
              />
              <StatTile
                label="Biggest Climb"
                value={stats.biggest_climb_elevation_gain ? `${Math.round(stats.biggest_climb_elevation_gain)} m` : '—'}
              />
              <StatTile
                label="Total Sessions"
                value={stats.all_ride_totals.count + stats.all_run_totals.count}
                sub="rides & runs combined"
              />
            </div>
          </motion.div>
        )}

        {/* All-Time Totals */}
        {stats && (
          <motion.div variants={item} initial="initial" animate="animate">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-text-secondary" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">
                All-Time Totals
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Total Ride Dist"
                value={formatDistance(stats.all_ride_totals.distance)}
              />
              <StatTile
                label="Total Ride Time"
                value={formatDuration(stats.all_ride_totals.moving_time)}
              />
              <StatTile
                label="Total Run Dist"
                value={formatDistance(stats.all_run_totals.distance)}
              />
              <StatTile
                label="Total Run Time"
                value={formatDuration(stats.all_run_totals.moving_time)}
              />
            </div>
          </motion.div>
        )}

        {/* Activity Breakdown */}
        {sportSummary.length > 0 && (
          <motion.div variants={item} initial="initial" animate="animate">
            <GlassCard variant="strong" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-[#fc4c02]" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">
                  Activity Breakdown
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sportSummary.map(([type, s]) => {
                  const meta = getSportMeta(type);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-3 rounded-xl p-3 border border-border"
                      style={{ background: `${meta.hex}08` }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${meta.hex}18`,
                          color: meta.hex,
                          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: meta.hex }}>
                          {meta.label}
                        </p>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {s.count} session{s.count !== 1 ? 's' : ''} · {formatDistance(s.distance)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 font-mono tabular-nums">
                        <p className="text-xs font-semibold text-text-primary">
                          {formatDuration(s.time)}
                        </p>
                        <p className="text-[10px] text-text-muted">total time</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Activity Heatmap */}
        <motion.div variants={item} initial="initial" animate="animate">
          <GlassCard variant="strong" className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-[#fc4c02]" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-text-primary">
                Activity Heatmap
              </h2>
            </div>
            <ActivityHeatmap activities={activities} />
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}
