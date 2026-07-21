'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
} from 'react';

type PreviewData = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string | null;
  tags: string[];
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type WikilinkPopoverProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  'data-wikilink'?: string;
};

/**
 * G3 popover: wraps <a> tags produced by remark-wikilink.
 * On hover/focus of a wikilink, fetches /api/preview/[slug] and shows a card.
 * Non-wikilink <a> tags (no data-wikilink) render as plain anchors.
 *
 * a11y: tooltip is labelled via aria-describedby while open; touch users
 * should follow the link (no reliable hover). Placement flips below the
 * anchor when there is not enough space above the viewport.
 */
export default function WikilinkPopover({
  href,
  'data-wikilink': slug,
  children,
  className,
  ...rest
}: WikilinkPopoverProps) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [open, setOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    // Prefer above; flip below when the card would clip the top edge.
    setPlacement(rect.top < 120 ? 'below' : 'above');
  }, [open, preview, loadState]);

  if (!slug) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }

  const handleEnter = async () => {
    setOpen(true);
    // Cache hit: show without refetch. Allow retry after soft errors.
    if (preview || loadState === 'loading') return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadState('loading');
    try {
      const res = await fetch(`/api/preview/${slug}`, { signal: controller.signal });
      if (!res.ok) {
        setLoadState('error');
        return;
      }
      setPreview(await res.json());
      setLoadState('ready');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setLoadState('error');
    }
  };

  const handleLeave = () => setOpen(false);

  return (
    <a
      ref={anchorRef}
      href={href}
      data-wikilink={slug}
      className={`wikilink ${className ?? ''}`.trim()}
      aria-describedby={open ? tooltipId : undefined}
      title="悬停或聚焦可预览摘要；触屏请直接点开链接"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      {...rest}
    >
      {children}
      {open && (
        <span
          id={tooltipId}
          className={
            placement === 'below'
              ? 'wikilink__popover wikilink__popover--below'
              : 'wikilink__popover'
          }
          role="tooltip"
          data-placement={placement}
        >
          {loadState === 'ready' && preview ? (
            <>
              <span className="wikilink__popover-title">{preview.title}</span>
              <span className="wikilink__popover-date">{preview.date}</span>
              <span className="wikilink__popover-desc">{preview.description}</span>
            </>
          ) : loadState === 'error' ? (
            <span className="wikilink__popover-loading">暂无预览</span>
          ) : (
            <span className="wikilink__popover-loading">加载中…</span>
          )}
        </span>
      )}
    </a>
  );
}
