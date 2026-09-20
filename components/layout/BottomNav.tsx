'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Activity, GitCompare, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/activities', icon: Activity, label: 'Activities' },
  { href: '/records', icon: Trophy, label: 'Records' },
  { href: '/compare', icon: GitCompare, label: 'Compare' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-bottom-nav flex items-center justify-around z-30 pb-safe px-2 py-1 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 min-h-[50px] flex flex-col items-center justify-center relative py-1 touch-manipulation"
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={`flex flex-col items-center justify-center w-full py-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#fc4c02]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-0 w-8 h-1 rounded-full bg-[#fc4c02] shadow-[0_0_10px_#fc4c02]"
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                />
              )}
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#fc4c02]/15 shadow-[0_0_12px_rgba(252,76,2,0.2)]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#fc4c02]' : 'text-text-secondary'}`} />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-[#fc4c02]' : 'font-medium'}`}>
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
