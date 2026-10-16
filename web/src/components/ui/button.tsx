import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 ease-out-expo focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-text-primary hover:bg-accent-hover active:bg-accent-active',
        secondary:
          'border border-border bg-bg-elevated text-text-primary hover:bg-bg-elevated/80',
        ghost:
          'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        danger:
          'bg-danger text-text-primary hover:bg-danger-hover active:bg-danger-active',
        token:
          'bg-amber text-text-inverse hover:bg-amber-hover active:bg-amber-active',
        /* Обратная совместимость */
        default:
          'bg-accent text-text-primary hover:bg-accent-hover active:bg-accent-active',
        outline:
          'border border-border bg-bg-elevated text-text-primary hover:bg-bg-elevated/80',
      },
      size: {
        sm: 'h-8 px-3 text-body-sm',
        md: 'h-10 px-4 text-body',
        lg: 'h-12 px-6 text-body-lg',
        icon: 'size-10',
        /* Обратная совместимость */
        default: 'h-10 px-4 text-body',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Comp>
  );
}
