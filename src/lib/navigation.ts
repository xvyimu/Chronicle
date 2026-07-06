export type NavItem = {
  href: string;
  label: string;
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/blog', label: '博客' },
  { href: '/links', label: '导航' },
  { href: '/categories', label: '分类' },
  { href: '/series', label: '专题' },
  { href: '/projects', label: '作品' },
  { href: '/about', label: '关于' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
