import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Menu = Dropdown.Root;
export const MenuTrigger = Dropdown.Trigger;

export const popoverClass =
  'z-50 min-w-44 rounded-lg bg-surface p-1 shadow-pop outline-none data-[state=open]:animate-[pop-in_140ms_var(--ease-out-quint)]';

export function MenuContent({ children, align = 'start', className }) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content align={align} sideOffset={4} className={cn(popoverClass, className)}>
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  );
}

const itemClass =
  'flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm text-fg outline-none select-none ' +
  'data-[highlighted]:bg-hover data-[disabled]:text-fg-faint data-[disabled]:pointer-events-none';

export function MenuItem({ children, onSelect, icon, hint, checked, disabled, destructive }) {
  return (
    <Dropdown.Item disabled={disabled} onSelect={onSelect} className={cn(itemClass, destructive && 'text-danger')}>
      {icon && <span className="flex size-4 items-center justify-center text-fg-muted">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {hint && <span className="text-xs text-fg-faint">{hint}</span>}
      {checked && <Check className="size-3.5 text-fg-muted" />}
    </Dropdown.Item>
  );
}

export function MenuLabel({ children }) {
  return <Dropdown.Label className="px-2 pt-1.5 pb-1 text-2xs font-medium text-fg-faint">{children}</Dropdown.Label>;
}

export function MenuSeparator() {
  return <Dropdown.Separator className="-mx-1 my-1 h-px bg-line" />;
}
