import { forwardRef } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/Avatar';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/Menu';
import { PRIORITIES, PRIORITY_LABEL, PriorityIcon, STATUS_LABEL, StatusIcon } from './meta';

export const Chip = forwardRef(function Chip({ className, bordered, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex h-7 max-w-full items-center gap-1.5 rounded-md px-2 text-sm text-fg outline-none transition-colors',
        'hover:bg-hover data-[state=open]:bg-hover',
        bordered && 'border border-line',
        className,
      )}
      {...props}
    />
  );
});

export function StatusPicker({ value, statuses, allowed, onChange, bordered }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Chip bordered={bordered}>
          <StatusIcon status={value} />
          {STATUS_LABEL[value]}
        </Chip>
      </MenuTrigger>
      <MenuContent className="w-52">
        {statuses.map((status) => {
          const blocked = !!allowed && status !== value && !allowed.includes(status);
          return (
            <MenuItem
              key={status}
              icon={<StatusIcon status={status} />}
              checked={status === value}
              disabled={blocked}
              hint={blocked ? 'Not allowed' : undefined}
              onSelect={() => status !== value && onChange(status)}
            >
              {STATUS_LABEL[status]}
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}

export function PriorityPicker({ value, onChange, bordered }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Chip bordered={bordered} className={cn(value === 'none' && 'text-fg-muted')}>
          <PriorityIcon priority={value} />
          {PRIORITY_LABEL[value]}
        </Chip>
      </MenuTrigger>
      <MenuContent className="w-44">
        {PRIORITIES.map((priority) => (
          <MenuItem
            key={priority}
            icon={<PriorityIcon priority={priority} />}
            checked={priority === value}
            onSelect={() => onChange(priority)}
          >
            {PRIORITY_LABEL[priority]}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export function AssigneePicker({ value, members, onChange, bordered, placeholder = 'Unassigned' }) {
  const current = members.find((m) => m.id === value);

  return (
    <Menu>
      <MenuTrigger asChild>
        <Chip bordered={bordered} className={cn(!current && 'text-fg-muted')}>
          {current ? <Avatar person={current} size={16} /> : <UserRound className="size-3.5" />}
          <span className="truncate">{current?.name ?? placeholder}</span>
        </Chip>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuItem icon={<UserRound className="size-3.5" />} checked={!value} onSelect={() => onChange(null)}>
          Unassigned
        </MenuItem>
        <MenuSeparator />
        <MenuLabel>Members</MenuLabel>
        {members.map((member) => (
          <MenuItem
            key={member.id}
            icon={<Avatar person={member} size={16} />}
            checked={member.id === value}
            onSelect={() => onChange(member.id)}
          >
            {member.name}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
