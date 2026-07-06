'use client';

import { useState, useRef, useEffect, type HTMLAttributes } from 'react';

/**
 * CodeBlock — 替代 CodeBlockEnhancer 的 React 组件。
 * 通过 MDX components 映射 pre 元素，在 React 渲染周期内完成包裹和复制按钮。
 * SSR 友好：复制按钮服务端渲染，hydration 后立即可用。
 *
 * rehype-pretty-code 会在 <pre> 上添加 data-language 属性。
 */
type PreProps = HTMLAttributes<HTMLPreElement> & { 'data-language'?: string };
type CopyState = 'idle' | 'copied' | 'failed';

const COPY_LABELS: Record<CopyState, string> = {
  idle: '复制',
  copied: '已复制 ✓',
  failed: '复制失败',
};

export default function CodeBlock({ children, ...props }: PreProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const preRef = useRef<HTMLPreElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const language = props['data-language'];

  const resetCopyState = (state: CopyState) => {
    setCopyState(state);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleCopy = async () => {
    const codeText = preRef.current?.querySelector('code')?.textContent || '';
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(codeText);
      resetCopyState('copied');
    } catch {
      // 降级方案：使用 execCommand 兼容非 HTTPS 环境
      try {
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) throw new Error('execCommand copy failed');
        resetCopyState('copied');
      } catch {
        resetCopyState('failed');
      }
    }
  };

  return (
    <div className="code-toolbar">
      {language && (
        <div className="code-block-header">
          <span className="code-block-lang">{language}</span>
        </div>
      )}
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        className={`copy-btn copy-btn--${copyState}`}
        onClick={handleCopy}
        type="button"
        title={COPY_LABELS[copyState]}
        aria-live="polite"
      >
        {COPY_LABELS[copyState]}
      </button>
    </div>
  );
}
