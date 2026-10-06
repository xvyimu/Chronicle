export type NavItem = {
  href: string;
  label: string;
};

/**
 * 主导航（单一来源）。
 *
 * 2026-10-06：移除已删路由 `/garden`（数字花园）与 `/links`（收藏导航）的死链；
 * 新增 `/archive`（归档，Iteration 05）。
 */
export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/blog', label: '文章' },
  { href: '/series', label: '专题' },
  { href: '/categories', label: '分类' },
  { href: '/tags', label: '标签' },
  { href: '/archive', label: '归档' },
  { href: '/favorites', label: '我的阅读' },
  { href: '/projects', label: '作品' },
  { href: '/about', label: '关于' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
