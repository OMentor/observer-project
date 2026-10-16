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
      className={animated ? `animate-weave ${className ?? ''}` : className}
      role="img"
      aria-label="Плетение"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5B5FEF" />
          <stop offset="100%" stopColor="#F0A030" />
        </linearGradient>
      </defs>
      <path
        d="M8 8 Q16 16 24 8 M8 24 Q16 16 24 24 M16 4 Q16 16 16 28"
        stroke="url(#logo-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
