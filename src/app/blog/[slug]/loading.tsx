import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPostLoading() {
  return (
    <section className="section">
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
