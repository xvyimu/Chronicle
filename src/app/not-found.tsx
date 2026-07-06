import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__title">页面不存在</p>
      <p className="not-found__desc">
        这个地址没有找到对应内容，可以回到核心入口继续阅读。
      </p>
      <div className="not-found__actions">
        <Link href="/" className="btn btn--primary">
          回到首页
        </Link>
        <Link href="/blog" className="btn btn--ghost">
          看博客
        </Link>
        <Link href="/links" className="btn btn--ghost">
          打开导航收藏
        </Link>
      </div>
    </div>
  );
}
