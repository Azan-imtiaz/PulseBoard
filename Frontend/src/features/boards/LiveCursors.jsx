import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getSocket } from '@/lib/socket';

const IDLE_MS = 8000;

// Positions are in board-content coordinates (not viewport), so they line up for
// everyone regardless of scroll position or window size.
export function LiveCursors() {
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    const socket = getSocket();
    const onMove = ({ user, x, y }) => setCursors((all) => ({ ...all, [user.id]: { user, x, y, seenAt: Date.now() } }));
    const onLeave = ({ userId }) => setCursors(({ [userId]: _gone, ...rest }) => rest);

    socket.on('cursor:move', onMove);
    socket.on('cursor:leave', onLeave);

    const sweep = setInterval(() => {
      const cutoff = Date.now() - IDLE_MS;
      setCursors((all) => {
        const fresh = Object.fromEntries(Object.entries(all).filter(([, c]) => c.seenAt > cutoff));
        return Object.keys(fresh).length === Object.keys(all).length ? all : fresh;
      });
    }, 2000);

    return () => {
      socket.off('cursor:move', onMove);
      socket.off('cursor:leave', onLeave);
      clearInterval(sweep);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {Object.values(cursors).map(({ user, x, y }) => (
          <motion.div
            key={user.id}
            className="absolute top-0 left-0"
            initial={{ x, y, opacity: 0, scale: 0.6 }}
            animate={{ x, y, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{
              x: { type: 'spring', stiffness: 380, damping: 32, mass: 0.6 },
              y: { type: 'spring', stiffness: 380, damping: 32, mass: 0.6 },
              opacity: { duration: 0.15 },
              scale: { type: 'spring', stiffness: 500, damping: 30 },
            }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18" className="drop-shadow-sm">
              <path
                d="M1 1l5.2 15 2.3-6.2L14.8 7.6z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="ml-3 -mt-0.5 block rounded-full px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.name.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const SEND_EVERY_MS = 40;

export function useCursorBroadcast() {
  const lastSent = useRef(0);

  return {
    onPointerMove(event) {
      const now = performance.now();
      if (now - lastSent.current < SEND_EVERY_MS) return;
      lastSent.current = now;
      const rect = event.currentTarget.getBoundingClientRect();
      getSocket().volatile.emit('cursor:move', {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
      });
    },
    onPointerLeave() {
      getSocket().emit('cursor:leave');
    },
  };
}
