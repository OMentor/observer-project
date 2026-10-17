import { colorForName, initialsFor } from '@/lib/palette';
import { cn } from '@/lib/cn';

function darken(hex: string, factor = 0.65): string {
  const v = hex.replace('#', '');
  const r = Math.round(parseInt(v.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(v.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(v.slice(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

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
        background: darken(colorForName(name)),
        color: '#ffffff',
        fontSize: Math.round(size * 0.4),
      }}
      className={cn(
        'flex items-center justify-center rounded-full font-medium',
        className,
      )}
    >
      {initialsFor(name)}
    </div>
  );
}
