'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ImageZoomProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ImageZoom — 文章内图片点击放大查看。
 * 点击图片时弹出全屏遮罩，显示大图，支持 ESC 关闭和点击遮罩关闭。
 *
 * 使用 next/image 优化图片加载。MDX 中的图片尺寸未知，
 * 因此内联图片使用默认尺寸 + 响应式 CSS，放大层使用 fill 布局。
 */
export default function ImageZoom({ src, alt, className, style }: ImageZoomProps) {
  const [zoomed, setZoomed] = useState(false);

  const open = useCallback(() => setZoomed(true), []);
  const close = useCallback(() => setZoomed(false), []);

  useEffect(() => {
    if (!zoomed) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [zoomed, close]);

  if (!src) return null;

  return (
    <>
      <Image
        src={src}
        alt={alt ?? ''}
        width={1200}
        height={630}
        onClick={open}
        className={className}
        style={{ cursor: 'zoom-in', width: '100%', height: 'auto', ...style }}
      />
      {zoomed && (
        <div
          className="image-zoom-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={alt || '图片预览'}
        >
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
