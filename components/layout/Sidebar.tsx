'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Home,
  GitCompare,
  Trophy,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import useSidebarStore from '@/store/useSidebarStore';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/activities', icon: Activity, label: 'Activities' },
  { href: '/records', icon: Trophy, label: 'Records' },
  { href: '/compare', icon: GitCompare, label: 'Compare' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="hidden lg:flex flex-col h-screen glass-nav z-20 select-none relative overflow-visible flex-shrink-0"
    >
      {/* Brand Header & Collapse Toggle */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'} border-b border-border/60`}>
        <Link href="/" className="flex items-center gap-3 group min-w-0">
          <div
            className="p-2.5 rounded-xl bg-gradient-to-br from-[#fc4c02]/20 to-[#f97316]/10 border border-[#fc4c02]/30 shadow-[0_0_18px_rgba(252,76,2,0.2)] group-hover:shadow-[0_0_24px_rgba(252,76,2,0.35)] transition-all duration-300 flex-shrink-0"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.25)' }}
            title="Strava Hub"
          >
            <Image src="/logo.svg" alt="Strava Hub Logo" width={20} height={20} className="w-5 h-5" />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent leading-none">
                  Strava Hub
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#fc4c02] mt-0.5">
                  Activity Flow
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Collapse / Expand Button */}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-[#fc4c02]/40 transition-all duration-200 cursor-pointer flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
          title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#fc4c02]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-2 p-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link href={item.href} className="block">
                <motion.div
                  whileHover={{ x: isCollapsed ? 0 : 2, scale: isCollapsed ? 1.05 : 1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`relative flex items-center rounded-xl min-h-[44px] transition-all duration-200 ${
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-[#fc4c02]/15 text-[#fc4c02] border border-[#fc4c02]/35 font-semibold shadow-[0_0_16px_rgba(252,76,2,0.15)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
                  }`}
                  style={
                    isActive
                      ? {
                          boxShadow:
                            'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 0 16px rgba(252, 76, 2, 0.15)',
                        }
                      : undefined
                  }
                >
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#fc4c02] shadow-[0_0_8px_#fc4c02]"
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  )}

                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-[#fc4c02]' : 'text-text-secondary'
                    }`}
                  />

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm tracking-tight overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>

              {/* Floating Tooltip in Collapsed Mode */}
              {isCollapsed && hoveredItem === item.href && (
                <div
                  className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <div
                    className="glass-strong px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xl border border-border flex items-center gap-2"
                    style={{
                      boxShadow:
                        'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 8px 24px -4px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <span className={isActive ? 'text-[#fc4c02]' : 'text-text-primary'}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fc4c02] shadow-[0_0_6px_#fc4c02]" />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Status & Theme Toggle */}
      <div
        className={`p-4 border-t border-border/60 flex items-center ${
          isCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'
        }`}
      >
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              <p className="text-[11px] text-text-muted font-medium">Strava Sync Active</p>
            </div>
            <ThemeToggle />
          </>
        ) : (
          <ThemeToggle />
        )}
      </div>
    </motion.aside>
  );
}
