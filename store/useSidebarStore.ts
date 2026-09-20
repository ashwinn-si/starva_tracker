'use client';

import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebar_collapsed') === 'true' : false,
  isMobileOpen: false,
  toggleCollapse: () => {
    set((state) => {
      const next = !state.isCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar_collapsed', String(next));
      }
      return { isCollapsed: next };
    });
  },
  setCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', String(collapsed));
    }
    set({ isCollapsed: collapsed });
  },
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),
}));

export default useSidebarStore;
