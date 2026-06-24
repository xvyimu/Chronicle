export default function BlogPostLoading() {
  return (
    <section className="section">
      <div className="section__inner">
        <div className="lg:flex lg:gap-12">
          {/* Article skeleton */}
          <article className="min-w-0 flex-1" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="mb-10 animate-pulse space-y-4">
              <div className="h-8 w-3/4 rounded bg-[var(--bg-soft)]" />
              <div className="h-4 w-40 rounded bg-[var(--bg-soft)]" />
              <div className="h-4 w-24 rounded bg-[var(--bg-soft)]" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`h-4 rounded bg-[var(--bg-soft)] ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>
          </article>

          {/* TOC sidebar skeleton */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-3 rounded bg-[var(--bg-soft)] ${i % 2 ? 'w-3/4' : 'w-full'}`} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
