import { colorForName, initialsFor } from '@/lib/palette';
import { cn } from '@/lib/cn';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 32, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        background: colorForName(name),
        fontSize: Math.round(size * 0.4),
      }}
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-text-primary',
        className,
      )}
    >
      {initialsFor(name)}
    </div>
  );
}
