import * as RadixTooltip from '@radix-ui/react-tooltip';

export const TooltipProvider = RadixTooltip.Provider;

export function Tooltip({ content, children, side = 'bottom' }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 flex items-center gap-2 rounded-md bg-fg px-2 py-1 text-xs text-canvas shadow-pop data-[state=delayed-open]:animate-[fade-in_100ms]"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
