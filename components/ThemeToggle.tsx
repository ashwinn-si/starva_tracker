'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '@/store/useThemeStore';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    const theme = saved || (isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDark]);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl border border-border bg-white/5 opacity-50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-border bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-[#fc4c02]/40 transition-all duration-200 cursor-pointer flex items-center justify-center"
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)' }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle color theme"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#fc4c02]" />}
    </button>
  );
}
