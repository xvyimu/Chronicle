import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/lib/site';
import HeaderScrollState from '@/components/layout/HeaderScrollState';
import MobileNav from '@/components/layout/MobileNav';

/**
 * TopBar — 工作台顶部栏（Server Component）。
 *
 * 2026-10-06 App Shell 重构：桌面主导航移入 `Sidebar`（左侧栏）；
 * TopBar 只保留品牌 + 全局搜索入口 + 主题切换 + 移动端菜单按钮。
 * 客户端岛：HeaderScrollState（滚动类）、ThemeToggle、MobileNav（Sheet）。
 */
export default function Header() {
  return (
    <header className="header" data-site-header>
      <HeaderScrollState />
      <div className="header__inner">
        <Link href="/" className="header__brand">
          <span className="header__logo">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </span>
          <span className="header__name">{SITE_CONFIG.name}</span>
        </Link>

        <div className="header__actions">
          <Button
            asChild
            size="icon-toolbar"
            variant="ghost"
            className="header__search-link"
          >
            <Link href="/" aria-label="前往搜索" title="前往搜索">
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
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </Link>
          </Button>
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
