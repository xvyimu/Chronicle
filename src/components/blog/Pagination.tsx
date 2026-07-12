import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath = '/blog',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="分页导航">
      {currentPage > 1 && (
        <Button asChild variant="ghost" size="sm" className="px-3">
          <Link
            href={currentPage === 2 ? basePath : `${basePath}?page=${currentPage - 1}`}
          >
            ← 上一页
          </Link>
        </Button>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const href = p === 1 ? basePath : `${basePath}?page=${p}`;
        const isCurrent = p === currentPage;
        return (
          <Button
            key={p}
            asChild
            variant={isCurrent ? 'default' : 'ghost'}
            size="icon"
            className="size-9"
          >
            <Link href={href} aria-current={isCurrent ? 'page' : undefined}>
              {p}
            </Link>
          </Button>
        );
      })}
      {currentPage < totalPages && (
        <Button asChild variant="ghost" size="sm" className="px-3">
          <Link href={`${basePath}?page=${currentPage + 1}`}>下一页 →</Link>
        </Button>
      )}
    </nav>
  );
}
