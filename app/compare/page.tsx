'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  GitCompare,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  RotateCcw,
  Trash2,
  Plus,
  Printer,
} from 'lucide-react';
import { getSportMeta } from '@/utils/sportConfig';
import { fmtActivityTimes } from '@/utils/timeUtils';
import Link from 'next/link';
import useStravaStore from '@/store/useStravaStore';
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { SessionPicker } from '@/components/ui/SessionPicker';

/* ─── types ─────────────────────────────────────────────────── */
interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elevation_gain?: number;
  start_date: string;
  average_speed: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  [key: string]: unknown;
}
interface StreamData {
  data: number[];
}
interface Streams {
  distance?: StreamData;
  time?: StreamData;
  heartrate?: StreamData;
  velocity_smooth?: StreamData;
  altitude?: StreamData;
}
interface SessionData {
  activity: Activity;
  streams: Streams;
}

/* ─── constants ──────────────────────────────────────────────── */
const COLORS = ['#fc4c02', '#8b5cf6', '#10b981', '#ef4444'];
const SLOT_LABELS = ['A', 'B', 'C', 'D'];
const COLOR_A = COLORS[0];
const COLOR_B = COLORS[1];

/* ─── helpers ────────────────────────────────────────────────── */
function fmtSplit(s: number) {
  const m = Math.floor(s / 60),
    sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function computeKmSplits(dist: number[], time: number[]) {
  const out: { km: number; s: number }[] = [];
  const totalKm = Math.floor((dist[dist.length - 1] ?? 0) / 1000);
  let prev = 0;
  for (let km = 1; km <= totalKm; km++) {
    const target = km * 1000;
    const idx = dist.findIndex(d => d >= target);
    if (idx < 1) break;
    const frac = (target - dist[idx - 1]) / (dist[idx] - dist[idx - 1]);
    const t = time[idx - 1] + frac * (time[idx] - time[idx - 1]);
    out.push({ km, s: t - prev });
    prev = t;
  }
  return out;
}

/* Interpolate a sorted (km, val) series at a target km using linear interp */
function interp(pts: { km: number; val: number }[], target: number): number | null {
  if (!pts.length || target < pts[0].km || target > pts[pts.length - 1].km) return null;
  let lo = 0,
    hi = pts.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].km <= target) lo = mid;
    else hi = mid;
  }
  const p0 = pts[lo],
    p1 = pts[hi];
  if (p0.km === p1.km) return p0.val;
  return p0.val + ((target - p0.km) / (p1.km - p0.km)) * (p1.val - p0.val);
}

function buildOverlay(
  sessions: SessionData[],
  key: 'velocity' | 'heartrate' | 'altitude',
  usePace: boolean
) {
  const extract = (sess: SessionData): { km: number; val: number }[] => {
    const dist = sess.streams.distance?.data ?? [];
    const raw =
      key === 'velocity'
        ? sess.streams.velocity_smooth?.data
        : key === 'heartrate'
          ? sess.streams.heartrate?.data
          : sess.streams.altitude?.data;
    if (!raw || !dist.length) return [];
    return dist.reduce<{ km: number; val: number }[]>((acc, d, i) => {
      const v = raw[i];
      if (key === 'velocity' && (!v || v < 0.5)) return acc; // filter stops/glitches
      const val = key === 'velocity' ? (usePace ? 1000 / v / 60 : v * 3.6) : v;
      acc.push({ km: d / 1000, val });
      return acc;
    }, []);
  };

  const seriesList = sessions.map(s => extract(s));
  if (seriesList.every(s => s.length === 0)) return [];

  const validSeries = seriesList.filter(s => s.length > 0);
  if (validSeries.length === 0) return [];

  // Union range
  const startKm = Math.min(...validSeries.map(s => s[0].km));
  const maxKm = Math.max(...validSeries.map(s => s[s.length - 1].km));
  if (maxKm <= startKm) return [];

  const STEP = 0.05;
  const result: { km: number; a?: number; b?: number; c?: number; d?: number }[] = [];
  for (let km = startKm + STEP; km <= maxKm + 0.001; km += STEP) {
    const kmR = Math.round(km * 100) / 100;
    const row: { km: number; a?: number; b?: number; c?: number; d?: number } = { km: kmR };
    let hasAny = false;
    sessions.forEach((_, idx) => {
      const val = interp(seriesList[idx], kmR);
      if (val !== null) {
        const keyChar = idx === 0 ? 'a' : idx === 1 ? 'b' : idx === 2 ? 'c' : 'd';
        row[keyChar] = val;
        hasAny = true;
      }
    });
    if (hasAny) result.push(row);
  }
  return result;
}

/* ─── sub-components ────────────────────────────────────────── */

function SportTypeStep({
  types,
  counts,
  onSelect,
}: {
  types: string[];
  counts: Record<string, number>;
  onSelect: (t: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-sm text-text-secondary mb-4 font-medium uppercase tracking-widest">
        Step 1 · Choose sport
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {types.map(type => {
          const m = getSportMeta(type);
          const Icon = m.icon;
          return (
            <motion.button
              key={type}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => onSelect(type)}
              className="glass-panel rounded-2xl p-5 flex flex-col items-start gap-3 border transition-all duration-200 cursor-pointer text-left"
              style={{ borderColor: `${m.hex}35` }}
            >
              <div className="p-2.5 rounded-xl" style={{ background: `${m.hex}18`, color: m.hex }}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-lg" style={{ color: m.hex }}>
                  {m.label}
                </p>
                <p className="text-text-secondary text-sm">{counts[type]} sessions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted self-end" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  vals,
  higherIsBetter = true,
}: {
  label: string;
  vals: (string | undefined)[];
  higherIsBetter?: boolean;
}) {
  const parsedVals = vals.map(v => {
    if (!v || v === '—') return NaN;
    const cleaned = v.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? NaN : num;
  });

  const validVals = parsedVals.filter(v => !isNaN(v));
  let bestVal = higherIsBetter ? -Infinity : Infinity;
  if (validVals.length > 0) {
    bestVal = higherIsBetter ? Math.max(...validVals) : Math.min(...validVals);
  }

  const winFlags = parsedVals.map(v => {
    if (isNaN(v) || bestVal === Infinity || bestVal === -Infinity) return false;
    return Math.abs(v - bestVal) < 0.0001;
  });

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {vals.map((val, idx) => {
          if (val === undefined) return null;
          const isWinner = winFlags[idx];
          const color = COLORS[idx];
          return (
            <div
              key={idx}
              className="flex-1 min-w-[70px] rounded-xl px-2.5 py-2 transition-colors"
              style={{
                background: isWinner ? `${color}12` : 'rgba(255,255,255,0.04)',
              }}
            >
              <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color }}>
                {SLOT_LABELS[idx]}
              </p>
              <p
                className={`font-mono font-bold text-sm leading-none`}
                style={{ color: isWinner ? color : 'var(--text-secondary)' }}
              >
                {val}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionHeader({ sess, slot, idx }: { sess: SessionData; slot: string; idx: number }) {
  const color = COLORS[idx];
  const m = getSportMeta(sess.activity.type);
  const Icon = m.icon;

  const startDateLocal = sess.activity.start_date_local as string | undefined;
  const elapsedTime = sess.activity.elapsed_time as number | undefined;
  const { localRange, istLabel, isIST } = fmtActivityTimes(
    sess.activity.start_date,
    startDateLocal,
    elapsedTime
  );

  return (
    <div
      className="glass-panel rounded-2xl p-5 flex items-start gap-4 border-t-2"
      style={{ borderColor: color }}
    >
      <div className="flex-shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
          style={{ background: color }}
        >
          {slot}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary leading-snug truncate">
          {sess.activity.name}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          {new Date(sess.activity.start_date).toLocaleDateString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
          })}
        </p>
        <p className="text-xs mt-0.5 font-mono" style={{ color, opacity: 0.9 }}>
          {isIST ? (
            `${localRange} IST`
          ) : (
            <>
              {localRange} · {istLabel}
            </>
          )}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs font-mono text-text-secondary">
          <span>{formatDistance(sess.activity.distance)}</span>
          <span className="text-text-muted">·</span>
          <span>{formatDuration(sess.activity.moving_time)}</span>
          <span className="text-text-muted">·</span>
          <span>
            {m.usePace
              ? formatPace(sess.activity.average_speed)
              : formatSpeed(sess.activity.average_speed)}
          </span>
        </div>
      </div>
      <div
        className="p-2 rounded-xl flex-shrink-0"
        style={{ background: `${m.hex}18`, color: m.hex }}
      >
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

function SplitTable({ sessions, names }: { sessions: SessionData[]; names: string[] }) {
  const splitsList = sessions.map(s =>
    computeKmSplits(s.streams.distance?.data ?? [], s.streams.time?.data ?? [])
  );
  const rows = Math.min(...splitsList.map(s => s.length));
  if (rows === 0 || isNaN(rows)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-6"
    >
      <h3 className="text-base font-semibold text-text-primary mb-1">Km Splits</h3>
      <p className="text-sm text-text-secondary mb-4">
        Time for each km — fastest split highlighted.
      </p>
      <div className="overflow-x-auto">
        <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--background)' }}>
              <tr className="border-b border-border">
                <th className="pb-3 pt-1 text-left font-medium text-text-secondary w-12">Km</th>
                {sessions.map((_, idx) => (
                  <th
                    key={idx}
                    className="pb-3 pt-1 text-center font-medium"
                    style={{ color: COLORS[idx] }}
                  >
                    {names[idx]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {Array.from({ length: rows }, (_, i) => {
                const rowSplits = splitsList.map(list => list[i]?.s ?? Infinity);
                const minSplit = Math.min(...rowSplits);

                return (
                  <tr key={i + 1} className="group">
                    <td className="py-2.5 font-semibold text-text-primary">{i + 1}</td>
                    {sessions.map((_, idx) => {
                      const splitVal = splitsList[idx][i]?.s;
                      if (splitVal === undefined)
                        return (
                          <td key={idx} className="py-2.5 text-center">
                            —
                          </td>
                        );
                      const isFastest = splitVal === minSplit && minSplit !== Infinity;
                      const color = COLORS[idx];
                      return (
                        <td key={idx} className="py-2.5 text-center">
                          <span
                            className={`font-mono text-sm px-2 py-0.5 rounded-lg ${isFastest ? 'font-bold' : ''}`}
                            style={{
                              color: color,
                              background: isFastest ? `${color}18` : undefined,
                            }}
                          >
                            {fmtSplit(splitVal)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {rows > 10 && (
        <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Scroll to see all {rows} splits
        </p>
      )}
    </motion.div>
  );
}

function OverlayChart({
  sessions,
  names,
  dataKey,
  usePace,
}: {
  sessions: SessionData[];
  names: string[];
  dataKey: 'velocity' | 'heartrate' | 'altitude';
  usePace: boolean;
}) {
  const data = useMemo(
    () => buildOverlay(sessions, dataKey, usePace),
    [sessions, dataKey, usePace]
  );
  if (data.length === 0) return null;

  const isVelocity = dataKey === 'velocity';
  const isAlt = dataKey === 'altitude';
  const title = isVelocity ? (usePace ? 'Pace' : 'Speed') : isAlt ? 'Elevation' : 'Heart Rate';
  const yLabel = isVelocity ? (usePace ? 'min/km' : 'km/h') : isAlt ? 'm' : 'bpm';

  const fmtTip = (v: number) => {
    if (isVelocity && usePace) {
      const m = Math.floor(v);
      const s = Math.round((v - m) * 60)
        .toString()
        .padStart(2, '0');
      return `${m}:${s} /km`;
    }
    if (isVelocity) return `${v.toFixed(1)} km/h`;
    if (isAlt) return `${Math.round(v)} m`;
    return `${Math.round(v)} bpm`;
  };

  const allVals = data.flatMap(d => [d.a, d.b, d.c, d.d]).filter((v): v is number => v != null);
  const minVal = Math.min(...allVals),
    maxVal = Math.max(...allVals);
  const pad = (maxVal - minVal) * 0.15 || 1;
  const yDomain: [number | string, number | string] = isVelocity
    ? ([0, 'auto'] as [number, string])
    : ([Math.max(0, minVal - pad), maxVal + pad] as [number, number]);

  const activeKeys: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'].slice(
    0,
    sessions.length
  ) as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        {activeKeys.map((k, idx) => (
          <span
            key={k}
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: COLORS[idx] }}
          />
        ))}
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      </div>
      <p className="text-sm text-text-secondary mb-4 ml-6">Overlaid on the same distance axis.</p>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} />
          <XAxis
            dataKey="km"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
            tickFormatter={v => (typeof v === 'number' ? v.toFixed(2) : v)}
            label={{
              value: 'km',
              position: 'insideBottomRight',
              offset: -4,
              fontSize: 11,
              fill: '#888',
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
            domain={yDomain}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
              fill: '#888',
            }}
            width={44}
            tickFormatter={v =>
              typeof v === 'number' ? (isVelocity && !usePace ? v.toFixed(0) : v.toFixed(1)) : v
            }
          />
          <Tooltip
            contentStyle={{
              background: '#1a1f2e',
              border: '1px solid #2a2f3e',
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: '#aaa', marginBottom: 4 }}
            formatter={(v: unknown, name: unknown) => [
              typeof v === 'number' ? fmtTip(v) : String(v),
              name === 'a'
                ? names[0]
                : name === 'b'
                  ? names[1]
                  : name === 'c'
                    ? names[2]
                    : names[3],
            ]}
            labelFormatter={l => `${typeof l === 'number' ? l.toFixed(2) : l} km`}
          />
          <Legend
            formatter={v => {
              const idx = v === 'a' ? 0 : v === 'b' ? 1 : v === 'c' ? 2 : 3;
              return <span style={{ color: COLORS[idx], fontSize: 12 }}>{names[idx]}</span>;
            }}
          />
          {activeKeys.map((k, idx) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[idx]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: COLORS[idx] }}
              isAnimationActive={false}
              name={k}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ─── page ───────────────────────────────────────────────────── */
function ComparePageInner() {
  const searchParams = useSearchParams();
  const { activities, loading, fetchAll } = useStravaStore();
  const preloadAId = searchParams.get('a');

  // step: 'sport' | 'sessions' | 'results'
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<(Activity | null)[]>([null, null]);
  const [sessions, setSessions] = useState<(SessionData | null)[]>([null, null]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([false, false]);

  useEffect(() => {
    if (activities.length === 0) fetchAll();
  }, [activities.length, fetchAll]);

  // Pre-select sport from URL param
  useEffect(() => {
    if (preloadAId && activities.length > 0 && selectedActivities[0] === null) {
      const found = activities.find(a => String(a.id) === preloadAId) ?? null;
      if (found) {
        setSelectedSport(found.type);
        setSelectedActivities([found, null]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadAId, activities.length]);

  const sportCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of activities) c[a.type] = (c[a.type] ?? 0) + 1;
    return c;
  }, [activities]);

  const sportTypes = Object.keys(sportCounts);

  // Sync lengths and fetch streams when selectedActivities change
  const activityIdsStr = selectedActivities.map(a => a?.id || 0).join(',');
  useEffect(() => {
    // Sync array sizes
    if (sessions.length !== selectedActivities.length) {
      setSessions(prev => {
        const next = [...prev];
        while (next.length < selectedActivities.length) next.push(null);
        while (next.length > selectedActivities.length) next.pop();
        return next;
      });
      setLoadingStates(prev => {
        const next = [...prev];
        while (next.length < selectedActivities.length) next.push(false);
        while (next.length > selectedActivities.length) next.pop();
        return next;
      });
    }

    selectedActivities.forEach((act, idx) => {
      if (!act) {
        if (sessions[idx] !== null) {
          setSessions(prev => {
            const next = [...prev];
            next[idx] = null;
            return next;
          });
        }
        return;
      }

      if (sessions[idx]?.activity.id === act.id) {
        return;
      }

      const fetchSession = async () => {
        setLoadingStates(prev => {
          const next = [...prev];
          next[idx] = true;
          return next;
        });
        try {
          const res = await fetch(`/api/activities/${act.id}`);
          const d = await res.json();
          setSessions(prev => {
            const next = [...prev];
            next[idx] = { activity: d.activity, streams: d.streams };
            return next;
          });
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingStates(prev => {
            const next = [...prev];
            next[idx] = false;
            return next;
          });
        }
      };

      fetchSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityIdsStr]);

  const handleSelectActivity = (idx: number, act: Activity | null) => {
    setSelectedActivities(prev => {
      const next = [...prev];
      next[idx] = act;
      return next;
    });
  };

  const addSessionSlot = () => {
    if (selectedActivities.length < 4) {
      setSelectedActivities(prev => [...prev, null]);
    }
  };

  const removeSessionSlot = (index: number) => {
    if (selectedActivities.length > 2) {
      setSelectedActivities(prev => prev.filter((_, idx) => idx !== index));
      setSessions(prev => prev.filter((_, idx) => idx !== index));
      setLoadingStates(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const getExcludeIds = (idx: number) => {
    return selectedActivities
      .filter((_, i) => i !== idx)
      .map(act => act?.id)
      .filter((id): id is number => id !== undefined);
  };

  const reset = () => {
    setSelectedSport(null);
    setSelectedActivities([null, null]);
    setSessions([null, null]);
    setLoadingStates([false, false]);
  };

  const activeSessions = sessions.filter((s): s is SessionData => s !== null);
  const dates = activeSessions.map(s => {
    return new Date(s.activity.start_date)
      .toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
      .split(', ')
      .slice(1, 2)
      .join('');
  });
  const activeNames = activeSessions.map((s, index) => dates[index]);

  const showResults = activeSessions.length >= 2;
  const isFetching = loadingStates.some(Boolean);

  const hasVelocity =
    showResults && activeSessions.every(s => (s.streams.velocity_smooth?.data?.length ?? 0) > 0);
  const hasHR =
    showResults && activeSessions.some(s => (s.streams.heartrate?.data?.length ?? 0) > 0);
  const hasAlt =
    showResults && activeSessions.every(s => (s.streams.altitude?.data?.length ?? 0) > 0);

  const sportUsePace = selectedSport ? getSportMeta(selectedSport).usePace : true;

  // Step indicator
  const step = !selectedSport ? 1 : selectedActivities.filter(Boolean).length < 2 ? 2 : 3;

  return (
    <main className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="px-4 md:px-8 lg:px-12 py-6 lg:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Link href="/activities">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-[#fc4c02]/40 transition-all duration-200 text-xs font-semibold uppercase tracking-wider min-h-[44px] cursor-pointer shadow-sm"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl bg-[#fc4c02]/15 text-[#fc4c02] border border-[#fc4c02]/30 shadow-[0_0_12px_rgba(252,76,2,0.15)]"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)' }}
            >
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#fc4c02]" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#fc4c02]">
                  Performance Head-to-Head
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Compare Sessions</h1>
            </div>
          </div>

          {selectedSport ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all duration-200 text-xs font-semibold uppercase tracking-wider min-h-[44px] cursor-pointer shadow-sm"
                style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
                title="Export comparison as PDF"
              >
                <Printer className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all duration-200 text-xs font-semibold uppercase tracking-wider min-h-[44px] cursor-pointer shadow-sm"
                style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          ) : (
            <div className="w-20" />
          )}
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {['Sport', 'Sessions', 'Results'].map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all min-h-[34px] ${
                    active
                      ? 'bg-[#fc4c02] text-white shadow-[0_0_16px_rgba(252,76,2,0.35)]'
                      : done
                        ? 'bg-white/10 text-text-primary border border-border'
                        : 'bg-white/5 text-text-muted border border-transparent'
                  }`}
                  style={
                    active
                      ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 0 4px 12px rgba(252, 76, 2, 0.35)' }
                      : undefined
                  }
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : done
                          ? 'bg-text-secondary text-[var(--background)]'
                          : 'bg-white/10 text-text-muted'
                    }`}
                  >
                    {n}
                  </span>
                  <span>{label}</span>
                </div>
                {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 1: Sport type ── */}
          {!loading && !selectedSport && (
            <motion.div
              key="sport"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SportTypeStep types={sportTypes} counts={sportCounts} onSelect={setSelectedSport} />
            </motion.div>
          )}

          {/* ── Step 2: Session pickers ── */}
          {!loading && selectedSport && (
            <motion.div
              key="pickers"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Sport badge */}
              <div className="flex items-center gap-2 mb-6">
                {(() => {
                  const m = getSportMeta(selectedSport);
                  const Icon = m.icon;
                  return (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold"
                      style={{ background: `${m.hex}15`, color: m.hex, borderColor: `${m.hex}35` }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {m.label}
                    </div>
                  );
                })()}
                <p className="text-text-secondary text-sm">
                  {sportCounts[selectedSport]} sessions available
                </p>
              </div>

              <p className="text-sm text-text-secondary mb-4 font-medium uppercase tracking-widest">
                Step 2 · Choose sessions to compare
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {selectedActivities.map((activity, idx) => {
                  const color = COLORS[idx];
                  const label = SLOT_LABELS[idx];
                  return (
                    <div
                      key={idx}
                      className="glass-panel rounded-2xl p-4 border-t-2"
                      style={{ borderColor: color }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: color }}
                          >
                            {label}
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            Session {label}
                          </span>
                        </div>
                        {selectedActivities.length > 2 && (
                          <button
                            onClick={() => removeSessionSlot(idx)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 transition-colors"
                            title="Remove session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <SessionPicker
                        label=""
                        accentColor={color}
                        activities={activities}
                        selected={activity}
                        onSelect={act => handleSelectActivity(idx, act)}
                        filterType={selectedSport}
                        excludeIds={getExcludeIds(idx)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add Session Button */}
              {selectedActivities.length < 4 && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={addSessionSlot}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl border border-dashed border-white/10 hover:border-accent-ride/40 text-text-secondary hover:text-text-primary transition-all duration-300 text-sm font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Session
                  </button>
                </div>
              )}

              {/* Loading */}
              {isFetching && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              )}

              {/* ── Results ── */}
              {showResults && !isFetching && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5 mt-6"
                >
                  <style>{`
                    @media print {
                      body {
                        background: white !important;
                        color: black !important;
                      }
                      aside, nav, header, button, .no-print, [role="navigation"] {
                        display: none !important;
                      }
                      main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        width: 100% !important;
                      }
                      .glass-panel {
                        border: 1px solid rgba(0, 0, 0, 0.15) !important;
                        background: white !important;
                        box-shadow: none !important;
                        color: black !important;
                      }
                      p, span, h1, h2, h3, th, td {
                        color: black !important;
                      }
                      svg {
                        max-width: 100% !important;
                      }
                    }
                  `}</style>

                  <div className="hidden print:block mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold">Strava Hub — Comparison Report</h1>
                    <p className="text-xs text-text-secondary mt-1">
                      Generated on{' '}
                      {new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'Asia/Kolkata',
                      })}
                    </p>
                  </div>

                  {/* Session headers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                    {activeSessions.map((sess, idx) => (
                      <SessionHeader
                        key={sess.activity.id}
                        sess={sess}
                        slot={SLOT_LABELS[idx]}
                        idx={idx}
                      />
                    ))}
                  </div>

                  {/* Stat grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard
                      label="Distance"
                      vals={activeSessions.map(s => formatDistance(s.activity.distance))}
                    />
                    <StatCard
                      label="Moving Time"
                      vals={activeSessions.map(s => formatDuration(s.activity.moving_time))}
                      higherIsBetter={false}
                    />
                    {sportUsePace ? (
                      <StatCard
                        label="Avg Pace"
                        vals={activeSessions.map(s => formatPace(s.activity.average_speed))}
                        higherIsBetter={false}
                      />
                    ) : (
                      <StatCard
                        label="Avg Speed"
                        vals={activeSessions.map(s => formatSpeed(s.activity.average_speed))}
                      />
                    )}
                    <StatCard
                      label="Elevation"
                      vals={activeSessions.map(
                        s => `${Math.round(s.activity.elevation_gain ?? 0)} m`
                      )}
                    />
                    <StatCard
                      label="Max Speed"
                      vals={activeSessions.map(
                        s => `${((s.activity.max_speed ?? 0) * 3.6).toFixed(1)} km/h`
                      )}
                    />
                    {hasHR && (
                      <StatCard
                        label="Avg Heart Rate"
                        vals={activeSessions.map(s =>
                          s.activity.average_heartrate
                            ? `${Math.round(s.activity.average_heartrate)} bpm`
                            : '—'
                        )}
                        higherIsBetter={false}
                      />
                    )}
                    {hasHR && (
                      <StatCard
                        label="Max Heart Rate"
                        vals={activeSessions.map(s =>
                          s.activity.max_heartrate
                            ? `${Math.round(s.activity.max_heartrate)} bpm`
                            : '—'
                        )}
                        higherIsBetter={false}
                      />
                    )}
                  </div>

                  {/* Km splits */}
                  {activeSessions.every(s => s.streams.distance?.data && s.streams.time?.data) && (
                    <SplitTable sessions={activeSessions} names={activeNames} />
                  )}

                  {/* Charts */}
                  {hasVelocity && (
                    <OverlayChart
                      sessions={activeSessions}
                      names={activeNames}
                      dataKey="velocity"
                      usePace={sportUsePace}
                    />
                  )}
                  {hasHR && (
                    <OverlayChart
                      sessions={activeSessions}
                      names={activeNames}
                      dataKey="heartrate"
                      usePace={false}
                    />
                  )}
                  {hasAlt && (
                    <OverlayChart
                      sessions={activeSessions}
                      names={activeNames}
                      dataKey="altitude"
                      usePace={false}
                    />
                  )}
                </motion.div>
              )}

              {/* Pick B prompt */}
              {selectedActivities[0] && !selectedActivities[1] && !isFetching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-2xl p-10 text-center text-text-secondary mt-4"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mx-auto mb-3 text-lg"
                    style={{ background: COLORS[1] }}
                  >
                    B
                  </div>
                  <p className="font-medium">Now pick Session B</p>
                  <p className="text-sm mt-1 opacity-60">Only {selectedSport} sessions shown.</p>
                </motion.div>
              )}

              {/* Pick A prompt */}
              {!selectedActivities[0] && !loadingStates[0] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-2xl p-10 text-center text-text-secondary"
                >
                  <div className="flex justify-center gap-3 mb-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
                      style={{ background: COLORS[0] }}
                    >
                      A
                    </div>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
                      style={{ background: COLORS[1] }}
                    >
                      B
                    </div>
                  </div>
                  <p className="font-medium">Choose Session A to get started</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageInner />
    </Suspense>
  );
}
