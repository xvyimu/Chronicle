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

export default function CodeBlock({ children, ...props }: PreProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const language = props['data-language'];

  const handleCopy = async () => {
    const codeText = preRef.current?.querySelector('code')?.textContent || '';
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案：使用 execCommand 兼容非 HTTPS 环境
      try {
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
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
      <button className="copy-btn" onClick={handleCopy} type="button">
        {copied ? '已复制 ✓' : '复制'}
      </button>
    </div>
  );
}
