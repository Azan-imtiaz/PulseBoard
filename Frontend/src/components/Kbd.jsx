import { cn } from '@/lib/cn';

export function Kbd({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm border border-line bg-subtle px-1',
        'font-sans text-2xs font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
