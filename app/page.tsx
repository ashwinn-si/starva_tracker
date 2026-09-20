'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import useStravaStore from '@/store/useStravaStore';
import { StatCard } from '@/components/cards/StatCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { TrendingUp, Clock, Calendar, RotateCw, Activity, ArrowUpRight } from 'lucide-react';
import { getSportMeta } from '@/utils/sportConfig';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

const container = {
  animate: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const item = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

export default function Dashboard() {
  const { athlete, activities, loading, error, fetchAll } = useStravaStore();

  const [dateRange, setDateRange] = useState<'7' | '15' | '30' | 'custom'>('7');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (dateRange === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }

    const days = parseInt(dateRange);
    start.setDate(end.getDate() - days);
    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const actDate = new Date(a.start_date);
      return actDate >= startDate && actDate <= endDate;
    });
  }, [activities, startDate, endDate]);

  const activityStats = useMemo(() => {
    const stats: Record<string, { distance: number; time: number; count: number }> = {};
    filteredActivities.forEach((a) => {
      if (!stats[a.type]) stats[a.type] = { distance: 0, time: 0, count: 0 };
      stats[a.type].distance += a.distance || 0;
      stats[a.type].time += a.moving_time || 0;
      stats[a.type].count += 1;
    });
    return stats;
  }, [filteredActivities]);

  if (error) {
    return (
      <main className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8 max-w-2xl">
          <GlassCard variant="strong" className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <h1 className="text-2xl font-bold tracking-tight">Strava Setup Required</h1>
            </div>
            <p className="text-text-secondary mb-6 leading-relaxed">{error}</p>
            <div className="glass-light rounded-xl p-5 mb-6 border border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                Configuration Steps:
              </p>
              <ol className="text-sm text-text-secondary space-y-2.5 list-decimal list-inside">
                <li>
                  Get Strava API credentials from{' '}
                  <a
                    href="https://www.strava.com/settings/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#fc4c02] hover:underline font-semibold"
                  >
                    strava.com/settings/api
                  </a>
                </li>
                <li>
                  Check <code className="bg-white/10 px-2 py-0.5 rounded text-xs">GET_CREDENTIALS.md</code> in project root
                </li>
                <li>
                  Update <code className="bg-white/10 px-2 py-0.5 rounded text-xs">.env.local</code> with your client ID & secret
                </li>
                <li>Restart the dev server</li>
              </ol>
            </div>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </GlassCard>
        </div>
      </main>
    );
  }

  const recentActivities = Array.isArray(activities) ? activities.slice(0, 5) : [];
  const totalDistance = Object.values(activityStats).reduce((sum, s) => sum + s.distance, 0);
  const totalTime = Object.values(activityStats).reduce((sum, s) => sum + s.time, 0);

  return (
    <main className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        {/* Hero Header with Quiet Luxury Atmosphere */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            {loading && !athlete ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-52 rounded-xl" />
                <Skeleton className="h-4 w-72 rounded-lg" />
              </div>
            ) : athlete ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#fc4c02] shadow-[0_0_8px_#fc4c02]" />
                  <span className="text-xs uppercase font-bold tracking-wider text-[#fc4c02]">
                    Athlete Profile
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-1 truncate">
                  {athlete.firstname} {athlete.lastname}
                </h1>
                <p className="text-sm text-text-secondary">
                  {[athlete.city, athlete.state, athlete.country].filter(Boolean).join(', ')}
                </p>
              </motion.div>
            ) : null}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAll(true)}
              disabled={loading}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-[#fc4c02]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
              title="Refresh data from Strava"
              aria-label="Refresh data from Strava"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#fc4c02]' : ''}`} />
            </button>
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Date Range Selector Pill Toolbar */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <GlassCard variant="strong" className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-2 text-text-secondary">
                  <Calendar className="w-4 h-4 text-[#fc4c02]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Time Window:</span>
                </div>

                {(['7', '15', '30'] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      dateRange === days
                        ? 'bg-[#fc4c02] text-white shadow-[0_0_16px_rgba(252,76,2,0.35)]'
                        : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                    }`}
                    style={
                      dateRange === days
                        ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 0 4px 14px rgba(252, 76, 2, 0.35)' }
                        : undefined
                    }
                  >
                    Last {days} days
                  </button>
                ))}

                <button
                  onClick={() => setDateRange('custom')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    dateRange === 'custom'
                      ? 'bg-[#fc4c02] text-white shadow-[0_0_16px_rgba(252,76,2,0.35)]'
                      : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                  }`}
                  style={
                    dateRange === 'custom'
                      ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 0 4px 14px rgba(252, 76, 2, 0.35)' }
                      : undefined
                  }
                >
                  Custom
                </button>
              </div>

              {dateRange === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-border flex items-center gap-3 flex-wrap"
                >
                  <input
                    type="date"
                    value={customStartDate.toISOString().split('T')[0]}
                    onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-white/5 text-text-primary rounded-xl text-xs border border-border focus:outline-none focus:border-[#fc4c02] transition-colors"
                  />
                  <span className="text-text-secondary text-xs font-medium">to</span>
                  <input
                    type="date"
                    value={customEndDate.toISOString().split('T')[0]}
                    onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                    className="px-3 py-2 bg-white/5 text-text-primary rounded-xl text-xs border border-border focus:outline-none focus:border-[#fc4c02] transition-colors"
                  />
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Primary Metrics Grid */}
        <motion.div className="mb-8">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={container}
            initial="initial"
            animate={loading ? 'initial' : 'animate'}
          >
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <motion.div key={i} variants={item}>
                  <Skeleton className="h-32 rounded-2xl" />
                </motion.div>
              ))
            ) : (
              [
                {
                  label: `${dateRange === 'custom' ? 'Period' : 'Last ' + dateRange + 'd'} Distance`,
                  value: formatDistance(totalDistance),
                  icon: <TrendingUp className="w-4 h-4" />,
                  sublabel: 'Aggregated volume',
                },
                {
                  label: `${dateRange === 'custom' ? 'Period' : 'Last ' + dateRange + 'd'} Active Time`,
                  value: formatDuration(totalTime),
                  icon: <Clock className="w-4 h-4" />,
                  sublabel: 'Moving time',
                },
                {
                  label: `Activities ${dateRange === 'custom' ? 'in Period' : 'Logged'}`,
                  value: filteredActivities.length,
                  icon: <Activity className="w-4 h-4" />,
                  sublabel: `${(filteredActivities.length / (dateRange === 'custom' ? 14 : parseInt(dateRange)) * 7).toFixed(1)} per week pace`,
                },
                {
                  label: 'Sports Tracked',
                  value: Object.keys(activityStats).length,
                  icon: <ArrowUpRight className="w-4 h-4" />,
                  sublabel: 'Active disciplines',
                },
              ].map((stat, idx) => (
                <motion.div key={idx} variants={item}>
                  <StatCard {...stat} />
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>

        {/* Activity Breakdown by Sport */}
        {!loading && Object.keys(activityStats).length > 0 && (
          <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">Discipline Breakdown</h2>
              <span className="text-xs text-text-muted font-medium">Period aggregates</span>
            </div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" variants={container} initial="initial" animate="animate">
              {Object.entries(activityStats).map(([type, stats]) => {
                const meta = getSportMeta(type);
                const Icon = meta.icon;
                return (
                  <motion.div key={type} variants={item}>
                    <GlassCard variant="mid" className="p-4 flex items-center gap-3.5 border hover:border-[#fc4c02]/30 transition-all">
                      <div
                        className="p-2.5 rounded-xl flex-shrink-0"
                        style={{
                          background: `${meta.hex}18`,
                          border: `1px solid ${meta.hex}30`,
                          color: meta.hex,
                          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm block truncate" style={{ color: meta.hex }}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {stats.count} session{stats.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 font-mono tabular-nums">
                        <p className="text-sm font-bold text-text-primary">{formatDistance(stats.distance)}</p>
                        <p className="text-[11px] text-text-secondary">{formatDuration(stats.time)}</p>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* Recent Activities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight text-text-primary">Recent Activities</h2>
            {activities.length > 5 && (
              <Link
                href="/activities"
                className="text-xs font-semibold text-[#fc4c02] hover:text-[#f97316] flex items-center gap-1 transition-colors"
              >
                <span>View all {activities.length}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <motion.div variants={container} initial="initial" animate="animate" className="grid gap-4">
              {recentActivities.map((activity) => (
                <motion.div key={activity.id} variants={item}>
                  <ActivityCard activity={activity} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState title="No activities logged yet" description="Sync your Strava account to view your activity stream" />
          )}
        </div>
      </div>
    </main>
  );
}
