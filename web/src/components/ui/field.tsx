import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Label } from '@/components/ui/label';

export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: ReactNode;
  helper?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  helper,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <span className="text-caption text-danger">{error}</span>
      ) : helper ? (
        <span className="text-caption text-text-muted">{helper}</span>
      ) : null}
    </div>
  );
}
