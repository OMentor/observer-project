import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-bg-surface p-5 shadow-card transition-all duration-150 ease-out-expo',
        interactive && 'hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  );
}
