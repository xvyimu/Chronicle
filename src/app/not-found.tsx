import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <h1 className="text-6xl font-bold text-[var(--text-dim)]">404</h1>
      <p className="mt-4 text-lg text-[var(--text-soft)]">页面不存在</p>
      <Link href="/" className="mt-8 text-sm text-[var(--brand)] hover:underline">
        回到首页 →
      </Link>
    </div>
  );
}
