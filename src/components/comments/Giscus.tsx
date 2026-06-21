'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '@/lib/constants';

interface GiscusProps {
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping?: 'pathname' | 'url' | 'title' | 'og:title';
  reactionsEnabled?: '1' | '0';
  inputPosition?: 'top' | 'bottom';
  lang?: string;
}

export default function Giscus({
  repoId = '',
  category = 'Announcements',
  categoryId = '',
  mapping = 'pathname',
  reactionsEnabled = '1',
  inputPosition = 'bottom',
  lang = 'zh-CN',
}: GiscusProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    const attrs: Record<string, string> = {
      'data-repo': SITE_CONFIG.giscus.repo,
      'data-repo-id': repoId,
      'data-category': category,
      'data-category-id': categoryId,
      'data-mapping': mapping,
      'data-reactions-enabled': reactionsEnabled,
      'data-emit-metadata': '0',
      'data-input-position': inputPosition,
      'data-theme': 'preferred_color_scheme',
      'data-lang': lang,
      'data-loading': 'lazy',
    };

    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    container.appendChild(script);
    scriptLoaded.current = true;
  }, [repoId, category, categoryId, mapping, reactionsEnabled, inputPosition, lang]);

  // Sync theme with giscus when site theme changes
  useEffect(() => {
    const sendTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const giscusTheme = isDark ? 'dark' : 'light';
      const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme: giscusTheme } } },
          'https://giscus.app'
        );
      }
    };

    // Observe theme changes
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'class') {
          sendTheme();
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    // Send initial theme once giscus iframe is loaded
    const timer = setInterval(() => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (iframe) {
        sendTheme();
        clearInterval(timer);
      }
    }, 500);
    // Stop polling after 10s
    const timeout = setTimeout(() => clearInterval(timer), 10000);

    return () => {
      observer.disconnect();
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  return <div ref={containerRef} className="mt-16" />;
}