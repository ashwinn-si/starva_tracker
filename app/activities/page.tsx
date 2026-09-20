'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useStravaStore from '@/store/useStravaStore';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import { Filter, RotateCw, ArrowUpDown } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { getSportMeta } from '@/utils/sportConfig';

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

const ITEMS_PER_PAGE = 10;

export default function ActivitiesPage() {
  const { activities, loading, error, fetchAll } = useStravaStore();
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'elevation'>('date');
  const [currentPage, setCurrentPage] = useState(1);

  const { ref } = useInView({
    threshold: 0,
    rootMargin: '400px',
    onChange: (inView) => {
      if (inView && currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (sportFilter) {
      filtered = filtered.filter((a) => a.type === sportFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (b.distance || 0) - (a.distance || 0);
        case 'elevation':
          return (b.elevation_gain || 0) - (a.elevation_gain || 0);
        case 'date':
        default:
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });
  }, [activities, sportFilter, sortBy]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(0, currentPage * ITEMS_PER_PAGE);

  const sportTypes = useMemo(() => [...new Set(activities.map((a) => a.type))], [activities]);

  const handleSportFilterChange = (sport: string | null) => {
    setSportFilter(sport);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: 'date' | 'distance' | 'elevation') => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <EmptyState title="Error loading activities" description={error} />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        {/* Header with Title & Refresh */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#fc4c02] shadow-[0_0_8px_#fc4c02]" />
              <span className="text-xs uppercase font-bold tracking-wider text-[#fc4c02]">
                Chronological Feed
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          </div>

          <button
            onClick={() => fetchAll(true)}
            disabled={loading}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-[#fc4c02]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
            title="Refresh activities from Strava"
            aria-label="Refresh activities from Strava"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#fc4c02]' : ''}`} />
          </button>
        </div>

        {/* Filter & Sort Toolbar */}
        {!loading && activities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <GlassCard variant="strong" className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-1 text-text-secondary">
                  <Filter className="w-4 h-4 text-[#fc4c02]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sport:</span>
                </div>

                <button
                  onClick={() => handleSportFilterChange(null)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    sportFilter === null
                      ? 'bg-[#fc4c02] text-white shadow-[0_0_14px_rgba(252,76,2,0.35)]'
                      : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                  }`}
                  style={
                    sportFilter === null
                      ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)' }
                      : undefined
                  }
                >
                  All ({activities.length})
                </button>

                {sportTypes.map((sport) => {
                  const meta = getSportMeta(sport);
                  const count = activities.filter((a) => a.type === sport).length;
                  const isSelected = sportFilter === sport;
                  return (
                    <button
                      key={sport}
                      onClick={() => handleSportFilterChange(sport)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#fc4c02] text-white shadow-[0_0_14px_rgba(252,76,2,0.35)]'
                          : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                      }`}
                      style={
                        isSelected
                          ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)' }
                          : undefined
                      }
                    >
                      <span>{meta.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-text-muted'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Sort selector in glass styling */}
                <div className="ml-auto flex items-center gap-2 pl-2 border-l border-border/60">
                  <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as 'date' | 'distance' | 'elevation')}
                    className="bg-white/5 text-text-primary rounded-xl px-3 py-1.5 text-xs font-medium border border-border focus:outline-none focus:border-[#fc4c02] transition-colors cursor-pointer min-h-[38px]"
                  >
                    <option value="date" className="bg-[#12151c] text-white">Latest First</option>
                    <option value="distance" className="bg-[#12151c] text-white">Longest Distance</option>
                    <option value="elevation" className="bg-[#12151c] text-white">Most Elevation</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Activities List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : paginatedActivities.length > 0 ? (
          <>
            <motion.div className="grid gap-4 mb-6" variants={container} initial="initial" animate="animate">
              {paginatedActivities.map((activity) => (
                <motion.div key={activity.id} variants={item}>
                  <ActivityCard activity={activity} />
                </motion.div>
              ))}
            </motion.div>

            {/* Infinite Scroll Trigger */}
            {currentPage < totalPages && (
              <div ref={ref} className="py-8 flex justify-center items-center gap-2 text-xs text-text-muted">
                <div className="w-5 h-5 rounded-full border-2 border-[#fc4c02]/20 border-t-[#fc4c02] animate-spin" />
                <span>Loading more sessions...</span>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={sportFilter ? 'No activities matching filter' : 'No activities found'}
            description={sportFilter ? 'Try clearing or changing your sport filter' : 'Your activities will appear once synced'}
          />
        )}
      </div>
    </main>
  );
}
