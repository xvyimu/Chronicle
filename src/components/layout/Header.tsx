'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SITE_CONFIG } from '@/lib/site';
import { MAIN_NAV_ITEMS, isNavItemActive } from '@/lib/navigation';

function NavLinks({
  pathname,
  onNavigate,
  firstLinkRef,
}: {
  pathname: string;
  onNavigate?: () => void;
  firstLinkRef?: RefObject<HTMLAnchorElement | null>;
}) {
  return (
    <>
      {MAIN_NAV_ITEMS.map((item, index) => {
        const isActive = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`header__link ${isActive ? 'header__link--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            ref={index === 0 ? firstLinkRef : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileFirstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
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
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </span>
          <span className="header__name">{SITE_CONFIG.name}</span>
        </Link>

        <nav className="header__nav header__nav--desktop" aria-label="主导航">
          <NavLinks pathname={pathname} />
        </nav>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <div className="header__actions">
            <Button
              asChild
              size="icon-toolbar"
              variant="ghost"
              className="header__search-link"
            >
              <Link href="/blog?focus=search" aria-label="搜索文章" title="搜索文章">
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
            <SheetTrigger asChild>
              <Button
                type="button"
                size="icon-toolbar"
                variant="ghost"
                className="header__mobile-toggle"
                aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                title={mobileOpen ? '关闭菜单' : '打开菜单'}
              >
                {mobileOpen ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                )}
              </Button>
            </SheetTrigger>
          </div>

          <SheetContent
            side="top"
            id="mobile-nav"
            aria-label="主导航"
            overlayClassName={`header__backdrop${mobileOpen ? ' is-open' : ''}`}
            className={`header__nav header__nav--sheet${mobileOpen ? ' is-open' : ''}`}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              mobileFirstLinkRef.current?.focus();
            }}
          >
            <SheetTitle className="sr-only">站点导航</SheetTitle>
            <SheetDescription className="sr-only">移动端主导航菜单</SheetDescription>
            <NavLinks
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              firstLinkRef={mobileFirstLinkRef}
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
