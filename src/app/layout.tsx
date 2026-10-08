import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
// CSS 语义模块按顺序显式 import (Tailwind v4 下 postcss-import 失效,
// 详见 docs/specs/2026-06-29-css-import-fix-design.md)
// 路由专属：archive / blog-ui / article-ui / prose / home / reading / project-detail
// → 对应 segment layout 或 page（见 docs/css-conventions.md）。
import './styles/tokens.css'; // 设计令牌 (CSS 变量定义)
import './styles/base.css'; // 全局基础 (skip-link, header, footer, not-found)
import './styles/components.css'; // 通用布局与基础卡片
import './styles/controls.css'; // CTA 按钮、分页/标签/项目卡控件
import './styles/backdrop.css'; // 背景层 (body::before/after + stage)
import './styles/animations.css'; // 动画 (page fade)
import './styles/workspace.css'; // 工作台外壳 (TopBar + Sidebar + MainPanel)
import './styles/responsive.css'; // 响应式断点 (最后,覆盖前面)
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import SiteBackdropStage from '@/components/layout/SiteBackdropStage';
import SiteBackdropParallaxGate from '@/components/layout/SiteBackdropParallaxGate';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_CONFIG } from '@/lib/site';
import { shouldRenderVercelInsights } from '@/lib/observability';
import BackToTop from '@/components/ui/BackToTop';
import DarkModeScript from '@/components/ui/DarkModeScript';
import { getCspNonce } from '@/lib/csp';

// Font strategy (2026-10-07, 见 docs/adr/0008-self-hosted-latin-fonts.md):
// - 拉丁字体自托管（next/font/local），构建期不再联网拉 Google Fonts。
//   此前 next/font/google 在 CI/Vercel 拉不到字体时会 build 失败（间歇性）。
// - 中文正文改走系统字体栈（见下方 body fontFamily），不再下载 webfont：
//   Noto Sans SC 会被切成 101 个 woff2（4.29MB），自托管不划算。
// Preload 矩阵 (CH-PERF-002)：
// - JetBrains 400/700 preload=false → 代码/标签；按需加载，不与 LCP 竞争
// - Cormorant 500 preload=true → 首页 hero / section 标题是 LCP 候选，保留
const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-400.ttf', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
  // Code blocks and mono UI share the same face; keep metric fallback tight for CLS.
  adjustFontFallback: 'Arial',
});

const cormorantGaramond = localFont({
  src: './fonts/cormorant-garamond-500.ttf',
  weight: '500',
  variable: '--font-display',
  display: 'swap',
  preload: true,
  // Article titles use clamp(2.7rem, 6vw, 5.2rem); unadjusted fallback
  // was a primary CLS driver on /blog/nextjs-app-router in Lighthouse CI.
  adjustFontFallback: 'Times New Roman',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_CONFIG.name,
    images: [{ url: '/icon.svg', width: 512, height: 512, alt: SITE_CONFIG.name }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderVercelInsights = shouldRenderVercelInsights();
  const nonce = await getCspNonce();

  return (
    <html
      lang="zh-CN"
      className={`h-full antialiased ${jetbrainsMono.variable} ${cormorantGaramond.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          content="#fafafa"
          media="(prefers-color-scheme: light)"
        />
        <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />
        <DarkModeScript nonce={nonce} />
      </head>
      <body
        className="flex min-h-full flex-col text-[var(--text)]"
        style={{
          // 中文走系统字体栈（不下载 webfont）；拉丁字体由 next/font/local 提供。
          fontFamily:
            'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
        }}
      >
        <SiteBackdropStage />
        <SiteBackdropParallaxGate />
        <a href="#main-content" className="skip-link">
          跳到主要内容
        </a>
        <Header />
        <div className="workspace">
          <Sidebar />
          <div className="workspace__main">
            <main id="main-content" className="workspace__panel animate-fade-in">
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <BackToTop />
        {renderVercelInsights ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
