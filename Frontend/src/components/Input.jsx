import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const inputClass =
  'h-8 w-full rounded-md border border-line bg-surface px-2.5 text-sm text-fg outline-none transition-colors ' +
  'hover:border-line-strong focus:border-accent focus:ring-3 focus:ring-accent-soft';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-fg">
        {label}
        {hint && <span className="font-normal text-fg-faint">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-danger">{error}</span>}
    </label>
  );
}
