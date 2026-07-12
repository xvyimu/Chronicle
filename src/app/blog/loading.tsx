import { Skeleton } from '@/components/ui/skeleton';

export default function BlogLoading() {
  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div className="section__eyebrow" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
        <div className="mt-10 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border border-[var(--border)] p-5"
            >
              <Skeleton className="mb-3 h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
