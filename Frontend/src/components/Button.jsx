import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

const variants = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-line hover:bg-subtle hover:border-line-strong',
  ghost: 'text-fg-muted hover:bg-hover hover:text-fg',
  danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-white',
};

const sizes = {
  sm: 'h-7 px-2 text-xs gap-1.5',
  md: 'h-8 px-3 text-sm gap-2',
};

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', loading, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap select-none',
        'transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-3.5" />}
      {children}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton({ label, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-fg-muted',
        'transition-colors duration-100 hover:bg-hover hover:text-fg disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
