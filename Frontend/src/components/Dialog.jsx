import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

export function Dialog({ open, onOpenChange, title, description, children, className }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <RadixDialog.Content
          className={cn(
            'fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-surface shadow-pop outline-none',
            'data-[state=open]:animate-[dialog-in_180ms_var(--ease-out-quint)]',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-4">
            <div>
              <RadixDialog.Title className="text-base font-semibold tracking-tight">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-0.5 text-sm text-fg-muted">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close" className="-mr-2">
                <X className="size-4" />
              </IconButton>
            </RadixDialog.Close>
          </div>
          <div className="px-5 pt-4 pb-5">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
