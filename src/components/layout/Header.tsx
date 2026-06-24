'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { SITE_CONFIG } from '@/lib/constants';

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/blog', label: '博客' },
    { href: '/categories', label: '分类' },
    { href: '/projects', label: '作品' },
    { href: '/about', label: '关于' },
  ];

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header__inner">
        <Link href="/" className="header__brand">
          <span className="header__logo">
            {SITE_CONFIG.name.charAt(0)}
          </span>
          <span className="header__name">{SITE_CONFIG.name}</span>
        </Link>

        <div
          className={`header__backdrop ${mobileOpen ? 'is-open' : ''}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <nav className={`header__nav ${mobileOpen ? 'is-open' : ''}`} aria-label="主导航">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`header__link ${isActive ? 'header__link--active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="header__actions">
          <ThemeToggle />
          <button
            className="icon-btn header__menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="菜单"
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}