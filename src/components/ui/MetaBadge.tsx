import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MetaBadgeProps = ComponentProps<typeof Badge>;

export default function MetaBadge({
  className,
  variant = 'outline',
  ...props
}: MetaBadgeProps) {
  return <Badge variant={variant} className={cn('meta-badge', className)} {...props} />;
}
