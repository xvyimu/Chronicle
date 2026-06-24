import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({ currentPage, totalPages, basePath = '/blog' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="分页导航">
      {currentPage > 1 && (
        <Link
          href={currentPage === 2 ? basePath : `${basePath}?page=${currentPage - 1}`}
          className="inline-flex h-9 items-center rounded-md px-3 text-sm text-[var(--text-soft)] hover:bg-[var(--bg-soft)] transition-colors"
        >
          ← 上一页  </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const href = p === 1 ? basePath : `${basePath}?page=${p}`;
        return (
          <Link
            key={p}
            href={href}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors ${
              p === currentPage
                ? 'bg-primary text-white'
                : 'text-[var(--text-soft)] hover:bg-[var(--bg-soft)]'
            }`}
          >
            {p}
          </Link>
        );
      })}
      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="inline-flex h-9 items-center rounded-md px-3 text-sm text-[var(--text-soft)] hover:bg-[var(--bg-soft)] transition-colors"
        >
          下一页 →  </Link>
      )}
    </nav>
  );
}