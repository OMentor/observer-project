import { cn } from '@/lib/cn';

export interface DensityDotsProps {
  colors: string[];
  count: number;
  max?: number;
  className?: string;
}

export function DensityDots({
  colors,
  count,
  max = 3,
  className,
}: DensityDotsProps) {
  if (count <= 0) {
    return null;
  }
  const shown = colors.slice(0, max);
  const extra = count - shown.length;
  const diameter = 4;
  const gap = 2;
  const width = shown.length * (diameter + gap);

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`События: ${count}`}
    >
      <svg
        width={width}
        height={diameter}
        viewBox={`0 0 ${width} ${diameter}`}
        aria-hidden
      >
        {shown.map((color, index) => (
          <circle
            key={index}
            cx={index * (diameter + gap) + diameter / 2}
            cy={diameter / 2}
            r={diameter / 2}
            fill={color}
          />
        ))}
      </svg>
      {extra > 0 && (
        <span className="text-caption leading-none text-text-muted">
          +{extra}
        </span>
      )}
    </span>
  );
}
