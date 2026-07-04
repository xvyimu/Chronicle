import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageSectionProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  titleId?: string;
  titleAs?: 'h1' | 'h2';
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  headerClassName?: string;
  compactHeader?: boolean;
};

export default function PageSection({
  eyebrow,
  title,
  subtitle,
  titleId,
  titleAs = 'h2',
  action,
  children,
  className,
  innerClassName,
  headerClassName,
  compactHeader = false,
}: PageSectionProps) {
  const Heading = titleAs as ElementType;

  return (
    <section className={cn('section', className)}>
      <div className={cn('section__inner', innerClassName)}>
        <div
          className={cn(
            'section__head',
            compactHeader && 'section__head--compact',
            headerClassName,
          )}
        >
          <div>
            {eyebrow ? <span className="section__eyebrow">{eyebrow}</span> : null}
            <Heading id={titleId} className="section__title">
              {title}
            </Heading>
            {subtitle !== undefined ? (
              <p className="section__subtitle">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="section__action">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
