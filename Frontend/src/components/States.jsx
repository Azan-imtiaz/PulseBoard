import { cn } from '@/lib/cn';
import { Button } from './Button';

export function EmptyState({ title, body, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <p className="text-base font-medium text-fg">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <EmptyState
      className={className}
      title="Couldn't load this"
      body={message}
      action={onRetry && <Button onClick={onRetry}>Try again</Button>}
    />
  );
}
