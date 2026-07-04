'use client';

import { useEffect } from 'react';
import { usePersistedEnum } from '@/hooks/usePersistedEnum';

type FontSize = 'sm' | 'md' | 'lg';
type Width = 'narrow' | 'normal' | 'wide';

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '0.92rem',
  md: '1rem',
  lg: '1.12rem',
};
const WIDTH_MAP: Record<Width, string> = {
  narrow: '640px',
  normal: '720px',
  wide: '840px',
};

const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg'];
const WIDTHS: Width[] = ['narrow', 'normal', 'wide'];

const FONT_TITLES: Record<FontSize, string> = {
  sm: '小字号',
  md: '标准字号',
  lg: '大字号',
};
const WIDTH_TITLES: Record<Width, string> = {
  narrow: '窄栏',
  normal: '标准',
  wide: '宽栏',
};

export default function ReadingPreferences({
  targetId = 'article-content',
}: {
  targetId?: string;
}) {
  const {
    value: fontSize,
    cycle: cycleFontSize,
    hydrated,
  } = usePersistedEnum<FontSize>({
    key: 'reading-font-size',
    defaultValue: 'md',
    validValues: FONT_SIZES,
  });
  const { value: width, cycle: cycleWidth } = usePersistedEnum<Width>({
    key: 'reading-width',
    defaultValue: 'normal',
    validValues: WIDTHS,
  });

  // Apply font size + width to the prose container (skip until restored)
  useEffect(() => {
    if (!hydrated) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.style.setProperty('--reading-font-size', FONT_SIZE_MAP[fontSize]);
    el.style.setProperty('--reading-width', WIDTH_MAP[width]);
  }, [fontSize, width, targetId, hydrated]);

  return (
    <div className="reading-prefs" aria-label="阅读偏好">
      <button
        type="button"
        onClick={cycleFontSize}
        className="reading-prefs__btn"
        title={FONT_TITLES[fontSize]}
        aria-label={FONT_TITLES[fontSize]}
        style={{
          fontSize:
            fontSize === 'sm' ? '0.78rem' : fontSize === 'lg' ? '1rem' : '0.88rem',
        }}
      >
        A
      </button>
      <button
        type="button"
        onClick={cycleWidth}
        className="reading-prefs__btn"
        title={WIDTH_TITLES[width]}
        aria-label={WIDTH_TITLES[width]}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {width === 'narrow' && (
            <>
              <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3" />
              <path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" />
            </>
          )}
          {width === 'normal' && (
            <>
              <path d="M3 3h18" />
              <path d="M3 21h18" />
              <path d="M12 3v18" />
            </>
          )}
          {width === 'wide' && (
            <>
              <path d="M3 3h18v18H3z" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
