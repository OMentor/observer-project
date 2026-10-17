import { cn } from '@/lib/cn';
import { LOGO_STRANDS } from '@/components/ui/logo-strands';

export interface LogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function Logo({ size = 32, animated = false, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn(animated && 'animate-weave', className)}
      role="img"
      aria-label="Плетение"
    >
      <defs>
        <linearGradient
          id="logo-grad"
          gradientUnits="userSpaceOnUse"
          x1="6"
          y1="6"
          x2="26"
          y2="26"
        >
          <stop offset="0%" stopColor="#5B5FEF" />
          <stop offset="100%" stopColor="#F0A030" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LOGO_STRANDS.map((d) => (
          <path key={d} className="logo-strand" pathLength={100} d={d} />
        ))}
      </g>
    </svg>
  );
}
