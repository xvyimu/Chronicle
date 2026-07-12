'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePersistedEnum } from '@/hooks/usePersistedEnum';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  normal: '标准栏宽',
  wide: '宽栏',
};

export default function ReadingPreferences({
  targetId = 'article-content',
}: {
  targetId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
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

  const fontLabel = FONT_TITLES[fontSize];
  const widthLabel = WIDTH_TITLES[width];

  useEffect(() => {
    setMounted(true);
  }, []);

  const panel = (
    <div className="reading-prefs reading-prefs--left">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="reading-prefs__trigger h-auto justify-start gap-2 rounded-xl px-3 py-2"
            aria-label="阅读设置"
            title="阅读设置"
          >
            <span className="reading-prefs__icon" aria-hidden="true">
              阅
            </span>
            <span className="reading-prefs__text">
              <span className="reading-prefs__label">阅读</span>
              <span className="reading-prefs__value">
                {fontLabel} · {widthLabel}
              </span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={10}
          className="reading-prefs__panel w-[min(188px,calc(100vw-48px))] border-border p-2.5"
          role="group"
          aria-label="阅读设置"
        >
          <div className="reading-prefs__head" aria-hidden="true">
            <span className="reading-prefs__title">阅读设置</span>
            <span className="reading-prefs__hint">点击切换</span>
          </div>
          <div className="reading-prefs__controls">
            <Button
              type="button"
              variant="ghost"
              onClick={cycleFontSize}
              className="reading-prefs__btn h-auto justify-start gap-2 rounded-xl px-3 py-2"
              title={`切换字号，当前为${fontLabel}`}
              aria-label={`切换字号，当前为${fontLabel}`}
            >
              <span className="reading-prefs__icon" aria-hidden="true">
                字
              </span>
              <span className="reading-prefs__text">
                <span className="reading-prefs__label">字号</span>
                <span className="reading-prefs__value">{fontLabel}</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={cycleWidth}
              className="reading-prefs__btn h-auto justify-start gap-2 rounded-xl px-3 py-2"
              title={`切换栏宽，当前为${widthLabel}`}
              aria-label={`切换栏宽，当前为${widthLabel}`}
            >
              <span className="reading-prefs__icon" aria-hidden="true">
                栏
              </span>
              <span className="reading-prefs__text">
                <span className="reading-prefs__label">栏宽</span>
                <span className="reading-prefs__value">{widthLabel}</span>
              </span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  if (!mounted) return null;

  return createPortal(panel, document.body);
}
