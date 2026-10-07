import { headers } from 'next/headers';
import NavLinks from '@/components/layout/NavLinks';

/**
 * 工作台左侧栏（桌面端）——RSC，无客户端 JS。
 *
 * 路径高亮复用 `x-pathname`（proxy.ts 每请求写入），与 Header 同源。
 * 移动端由 CSS 隐藏，导航改走 MobileNav（Sheet）。
 * 导航项单一来源见 `src/lib/navigation.ts`。
 */
export default async function Sidebar() {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') ?? '/';

  return (
    <aside className="sidebar" aria-label="站点导航">
      <nav className="sidebar__nav">
        <NavLinks
          pathname={pathname}
          linkClassName="sidebar__link"
          activeClassName="sidebar__link--active"
        />
      </nav>
    </aside>
  );
}
