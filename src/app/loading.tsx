export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="h-16 border-b border-[var(--border)]">
        <div className="mx-auto h-full max-w-[1200px] animate-pulse px-6">
          <div className="flex h-full items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-soft)]" />
            <div className="h-5 w-24 rounded bg-[var(--bg-soft)]" />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="mx-auto max-w-2xl animate-pulse space-y-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-[var(--bg-soft)]" />
            <div className="mx-auto h-10 w-48 rounded bg-[var(--bg-soft)]" />
            <div className="mx-auto h-5 w-72 rounded bg-[var(--bg-soft)]" />
            <div className="mx-auto h-5 w-56 rounded bg-[var(--bg-soft)]" />
          </div>
        </div>
      </main>
    </div>
  );
}
