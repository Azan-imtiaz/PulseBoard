import { AvatarStack } from '@/components/Avatar';
import { Tooltip } from '@/components/Tooltip';

export function PresenceStack({ viewers, connected }) {
  if (!connected) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-faint">
        <span className="size-1.5 rounded-full bg-warn" />
        Reconnecting…
      </span>
    );
  }
  if (viewers.length === 0) return null;

  return (
    <Tooltip content={viewers.map((v) => v.name).join(', ')}>
      <div className="flex items-center gap-2">
        <AvatarStack people={viewers} max={4} size={22} />
        <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
          <span className="size-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-ok" />
          {viewers.length} viewing
        </span>
      </div>
    </Tooltip>
  );
}
