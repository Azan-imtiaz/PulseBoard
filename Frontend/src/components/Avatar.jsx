import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// A profile photo when the person has one, otherwise initials on their colour.
export function Avatar({ person, size = 20, className }) {
  const [failed, setFailed] = useState(false);

  if (person.avatarUrl && !failed) {
    return (
      <img
        src={person.avatarUrl}
        alt={person.name}
        title={person.name}
        onError={() => setFailed(true)}
        className={cn('inline-block shrink-0 rounded-full object-cover select-none', className)}
        style={{ width: size, height: size, backgroundColor: person.color }}
      />
    );
  }

  return (
    <span
      title={person.name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white select-none',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), backgroundColor: person.color }}
    >
      {initials(person.name)}
    </span>
  );
}

export function AvatarStack({ people, max = 4, size = 22 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div className="flex items-center">
      <AnimatePresence initial={false}>
        {shown.map((person) => (
          <motion.span
            key={person.id ?? person.name}
            layout
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 30 }}
            className="-ml-1.5 rounded-full ring-2 ring-canvas first:ml-0"
          >
            <Avatar person={person} size={size} />
          </motion.span>
        ))}
      </AnimatePresence>
      {extra > 0 && (
        <span
          className="-ml-1.5 inline-flex items-center justify-center rounded-full bg-subtle text-2xs font-medium text-fg-muted ring-2 ring-canvas"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
