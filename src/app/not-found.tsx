import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__title">页面不存在</p>
      <p className="not-found__desc">
        这个地址没有找到对应内容，可以回到核心入口继续阅读。
      </p>
      <div className="not-found__actions">
        <Button asChild size="cta">
          <Link href="/">回到首页</Link>
        </Button>
        <Button asChild size="cta" variant="outline">
          <Link href="/blog">看博客</Link>
        </Button>
        <Button asChild size="cta" variant="outline">
          <Link href="/links">打开导航收藏</Link>
        </Button>
      </div>
    </div>
  );
}
