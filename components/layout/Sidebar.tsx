'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Activity, Home, GitCompare, Trophy, User } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/activities', icon: Activity, label: 'Activities' },
  { href: '/records', icon: Trophy, label: 'Records' },
  { href: '/compare', icon: GitCompare, label: 'Compare' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 glass-nav p-6 z-20 select-none">
      {/* Brand Header with Quiet Luxury Glass Depth */}
      <Link href="/" className="mb-8 flex items-center gap-3 group">
        <div
          className="p-2.5 rounded-xl bg-gradient-to-br from-[#fc4c02]/20 to-[#f97316]/10 border border-[#fc4c02]/30 shadow-[0_0_20px_rgba(252,76,2,0.2)] group-hover:shadow-[0_0_28px_rgba(252,76,2,0.35)] transition-all duration-300"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.25)' }}
        >
          <Image src="/logo.svg" alt="Strava Hub Logo" width={22} height={22} className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent">
            Strava Hub
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#fc4c02]">
            Activity Flow
          </span>
        </div>
      </Link>

      {/* Navigation items with min 44px touch ergonomics & specular rims */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl min-h-[44px] transition-all duration-200 ${
                  isActive
                    ? 'bg-[#fc4c02]/15 text-[#fc4c02] border border-[#fc4c02]/35 font-semibold shadow-[0_0_16px_rgba(252,76,2,0.15)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
                }`}
                style={
                  isActive
                    ? { boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 0 16px rgba(252, 76, 2, 0.15)' }
                    : undefined
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#fc4c02] shadow-[0_0_8px_#fc4c02]"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#fc4c02]' : 'text-text-secondary'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer info & theme toggle */}
      <div className="pt-5 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          <p className="text-[11px] text-text-muted font-medium">Strava Sync Active</p>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
