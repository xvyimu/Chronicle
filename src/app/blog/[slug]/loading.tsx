import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPostLoading() {
  return (
    // 高度下限（R12）：文章页是流式的，骨架屏先到、正文随后。若骨架屏不足一屏，
    // 首帧页脚会落在首屏内，正文到达后把它顶走 → 大位移 CLS（实测 0.0745，CI runner 上 0.29）。
    // 让骨架屏首帧就占满一屏，页脚被推到首屏之外，CLS 降至 0.0012。
    // 取值必须接近 100vh：footer.top = 头部 64px + 本高度，需 ≥ 视口高才生效，
    // 低于约 93vh 无效（60vh 等「中间值」经复算不成立）。见 docs/13-risk-register.md · R12 跟进。
    <section className="section" style={{ minHeight: '100vh' }}>
      <div className="section__inner">
        <div className="lg:flex lg:gap-12">
          <article className="min-w-0 flex-1" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="mb-10 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>
          </article>

          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i % 2 ? 'w-3/4' : 'w-full'}`} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
