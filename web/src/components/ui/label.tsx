import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Label({
  className,
  ...props
}: ComponentProps<'label'>) {
  return (
    <label
      className={cn('text-body-sm font-medium text-text-secondary', className)}
      {...props}
    />
  );
}
