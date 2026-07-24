'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePersistedEnum } from '@/hooks/usePersistedEnum';
import { Button } from '@/components/ui/button';

type Theme = 'system' | 'light' | 'dark';

// Accessible name reflects current theme (cycle order: light → dark → system).
const LABELS: Record<Theme, string> = {
  light: '主题：浅色',
  dark: '主题：深色',
  system: '主题：跟随系统',
};

const ICONS: Record<Theme, ReactNode> = {
  light: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  dark: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  system: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

// Cycle order matches the original toggle(): light → dark → system → light
const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];

export default function ThemeToggle() {
  const {
    value: theme,
    cycle,
    hydrated: mounted,
  } = usePersistedEnum<Theme>({
    key: 'theme',
    defaultValue: 'system',
    validValues: THEME_CYCLE,
    // 'system' clears storage so the OS preference is followed on next visit;
    // explicit choices are persisted.
    persist: (value, storage) => {
      if (value === 'system') {
        storage.removeItem('theme');
      } else {
        storage.setItem('theme', value);
      }
    },
  });

  // Apply theme to documentElement + View Transition API
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const apply = () => root.classList.toggle('dark', isDark);

    // View Transition API: smooth crossfade when supported
    if (document.startViewTransition) {
      const transition = document.startViewTransition(apply);
      transition.ready.catch(() => undefined);
      transition.updateCallbackDone.catch(() => undefined);
      transition.finished.catch(() => undefined);
    } else {
      apply();
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

  if (!mounted) {
    return (
      <Button
        type="button"
        size="icon-toolbar"
        variant="ghost"
        aria-label="主题：加载中"
        title="主题：加载中"
      >
        <span style={{ width: 18, height: 18 }} aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={cycle}
      size="icon-toolbar"
      variant="ghost"
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
    >
      {ICONS[theme]}
    </Button>
  );
}
