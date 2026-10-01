import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';

// Same mark as public/favicon.svg: Lucide's Activity icon on a rounded square.
export function Logo({ className, markOnly }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex size-6 items-center justify-center rounded-lg bg-fg text-canvas" aria-hidden>
        <Activity className="size-4" strokeWidth={2.4} />
      </span>
      {!markOnly && <span className="text-[15px] font-semibold tracking-tight">PulseBoard</span>}
    </div>
  );
}
