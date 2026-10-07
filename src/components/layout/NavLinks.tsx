import Link from 'next/link';
import { MAIN_NAV_ITEMS, isNavItemActive } from '@/lib/navigation';

type NavLinksProps = {
  /** 当前路径（Sidebar 用 headers 的 x-pathname；MobileNav 用 usePathname）。 */
  pathname: string;
  /** 链接基础类名（如 `sidebar__link` / `header__link`）。 */
  linkClassName: string;
  /** 命中当前路由时追加的类名。 */
  activeClassName: string;
  /** 点击后的副作用（MobileNav 用于关闭 Sheet）。 */
  onNavigate?: () => void;
  /** 首个链接的 ref（MobileNav 用于开面板时聚焦）。 */
  firstLinkRef?: React.Ref<HTMLAnchorElement>;
};

/**
 * 主导航链接列表 — Sidebar 与 MobileNav 共用的渲染。
 *
 * 无 hooks，server / client 两侧均可渲染；路径与类名由调用方传入。
 * 抽出原因：两处曾各写一遍「isNavItemActive + aria-current」逻辑（易漂移）。
 */
export default function NavLinks({
  pathname,
  linkClassName,
  activeClassName,
  onNavigate,
  firstLinkRef,
}: NavLinksProps) {
  return (
    <>
      {MAIN_NAV_ITEMS.map((item, index) => {
        const isActive = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${linkClassName}${isActive ? ` ${activeClassName}` : ''}`}
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
