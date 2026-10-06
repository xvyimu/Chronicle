import Link from 'next/link';
import SearchPanel from '@/components/search/SearchPanel';
import type { SearchDoc } from '@/lib/search';

interface WorkspaceHeroProps {
  siteName: string;
  description: string;
  postCount: number;
  projectCount: number;
  docs: SearchDoc[];
}

/**
 * 工作台欢迎区 —— 首页视觉核心。
 *
 * 品牌 + 一句介绍 + 计数 + 集中式搜索入口（站内搜索，非聊天框）。
 * 服务端渲染外壳；搜索面板为客户端岛（SearchPanel）。
 */
export default function WorkspaceHero({
  siteName,
  description,
  postCount,
  projectCount,
  docs,
}: WorkspaceHeroProps) {
  return (
    <section className="ws-hero" aria-labelledby="home-hero-title">
      <p className="ws-hero__eyebrow">Content Workspace</p>
      <h1 id="home-hero-title" className="ws-hero__title">
        {siteName}
      </h1>
      <p className="ws-hero__desc">{description}</p>

      <div className="ws-hero__stats">
        <Link href="/blog" className="ws-hero__stat">
          <strong>{postCount}</strong>
          <span>篇文章</span>
        </Link>
        <Link href="/projects" className="ws-hero__stat">
          <strong>{projectCount}</strong>
          <span>个项目</span>
        </Link>
      </div>

      <SearchPanel docs={docs} />
    </section>
  );
}
