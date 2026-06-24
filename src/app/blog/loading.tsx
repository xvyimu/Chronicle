export default function BlogLoading() {
  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div className="section__eyebrow" />
          <div className="h-8 w-24 animate-pulse rounded bg-[var(--bg-soft)]" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-[var(--bg-soft)]" />
        </div>
        <div className="mt-10 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[var(--radius)] border border-[var(--border)] p-5">
              <div className="mb-3 h-5 w-2/3 rounded bg-[var(--bg-soft)]" />
              <div className="h-4 w-full rounded bg-[var(--bg-soft)]" />
              <div className="mt-2 h-4 w-3/4 rounded bg-[var(--bg-soft)]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
