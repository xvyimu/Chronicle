'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'system' | 'light' | 'dark';

const LABELS: Record<Theme, string> = {
  light: '切换到暗色',
  dark: '切换到亮色',
  system: '跟随系统',
};

const ICONS: Record<Theme, ReactNode> = {
  light: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  dark: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  system: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && VALID_THEMES.includes(stored)) setTheme(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const isDark =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const apply = () => root.classList.toggle('dark', isDark);

    // View Transition API: smooth crossfade when supported
    if (document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }

    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system' || !mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, mounted]);

  const toggle = () => {
    const cycle: Theme[] = ['light', 'dark', 'system'];
    const next = (cycle.indexOf(theme) + 1) % cycle.length;
    setTheme(cycle[next]);
  };

  if (!mounted) {
    return (
      <button type="button" className="icon-btn" aria-label="切换主题">
        <span style={{ width: 18, height: 18 }} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      aria-label="切换主题"
      title={LABELS[theme]}
    >
      {ICONS[theme]}
    </button>
  );
}