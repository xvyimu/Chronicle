import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import MetaBadge from '@/components/ui/MetaBadge';
import { cn } from '@/lib/utils';

type ArchiveCardProps = {
  href: string;
  title: ReactNode;
  countLabel: ReactNode;
  meta?: ReactNode;
  tags?: readonly string[];
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function ArchiveCard({
  href,
  title,
  countLabel,
  meta,
  tags,
  children,
  className,
  contentClassName,
}: ArchiveCardProps) {
  return (
    <Card asChild size="sm" className={cn('archive-card', className)}>
      <Link href={href}>
        <CardHeader className="archive-card__head px-0">
          <CardTitle className="min-w-0">
            <h3 className="archive-card__title">{title}</h3>
            {meta ? <p className="archive-card__meta">{meta}</p> : null}
          </CardTitle>
          <CardAction>
            <MetaBadge variant="secondary" className="archive-card__count">
              {countLabel}
            </MetaBadge>
          </CardAction>
        </CardHeader>

        {tags && tags.length > 0 ? (
          <CardContent className="archive-card__tags px-0">
            {tags.map((tag) => (
              <MetaBadge key={tag} className="archive-card__tag">
                {tag}
              </MetaBadge>
            ))}
          </CardContent>
        ) : null}

        {children ? (
          <CardContent className={cn('archive-card__content px-0', contentClassName)}>
            {children}
          </CardContent>
        ) : null}
      </Link>
    </Card>
  );
}
