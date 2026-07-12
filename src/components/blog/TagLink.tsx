import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function TagLink({ tag, slug }: { tag: string; slug: string }) {
  return (
    <Badge asChild variant="secondary" className="tag-link px-2.5 py-0.5 font-medium">
      <Link href={`/tags/${encodeURIComponent(slug)}`}>{tag}</Link>
    </Badge>
  );
}
