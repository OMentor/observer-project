import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-4 cursor-pointer rounded-sm border-border bg-bg-surface accent-accent transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}
