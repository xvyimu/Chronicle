'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ImageZoomProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Optional LQIP; when set, next/image uses blur placeholder on the thumb. */
  blurDataURL?: string;
}

/**
 * ImageZoom — 文章内图片点击放大查看。
 * 点击图片时弹出全屏遮罩，显示大图，支持 ESC 关闭、点击遮罩关闭、关闭按钮。
 *
 * 可访问性：
 * - role="dialog" + aria-modal="true"
 * - 打开时焦点移入对话框，关闭时返回触发元素
 * - Tab/Shift+Tab 焦点循环（focus trap）
 * - 可见关闭按钮（aria-label="关闭"）
 *
 * 使用 next/image 优化图片加载。MDX 中的图片尺寸未知，
 * 因此内联图片使用默认尺寸 + 响应式 CSS，放大层使用 fill 布局。
 */
export default function ImageZoom({
  src,
  alt,
  className,
  style,
  blurDataURL,
}: ImageZoomProps) {
  const [zoomed, setZoomed] = useState(false);
  const triggerRef = useRef<HTMLImageElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => setZoomed(true), []);
  const close = useCallback(() => setZoomed(false), []);

  useEffect(() => {
    if (!zoomed) return;
    const trigger = triggerRef.current; // Capture ref value for cleanup

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      // Focus trap: Tab cycles within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === dialogRef.current
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    // Move focus into dialog on open
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      // Return focus to trigger element on close
      trigger?.focus();
    };
  }, [zoomed, close]);

  if (!src) return null;

  return (
    <>
      <Image
        ref={triggerRef as React.RefObject<HTMLImageElement>}
        src={src}
        alt={alt ?? ''}
        width={1200}
        height={630}
        onClick={open}
        className={className}
        style={{ cursor: 'zoom-in', width: '100%', height: 'auto', ...style }}
        tabIndex={0}
        role="button"
        aria-label={alt ? `${alt} — 点击放大` : '点击放大图片'}
        placeholder={blurDataURL ? 'blur' : undefined}
        blurDataURL={blurDataURL}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
      />
      {zoomed && (
        <div
          ref={dialogRef}
          className="image-zoom-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={alt || '图片预览'}
          tabIndex={-1}
        >
          <button
            ref={closeBtnRef}
            type="button"
            className="image-zoom__close"
            onClick={close}
            aria-label="关闭"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid var(--border, rgba(255,255,255,0.2))',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={src}
            alt={alt ?? ''}
            fill
            className="image-zoom__img"
            onClick={(e) => e.stopPropagation()}
            style={{ objectFit: 'contain' }}
            sizes="92vw"
          />
        </div>
      )}
    </>
  );
}
