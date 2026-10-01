import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/Avatar';
import { PriorityIcon, STATUS_LABEL, StatusIcon } from '@/features/tasks/meta';

// A scripted, non-interactive preview of a live board for the home page: two
// teammates move cards while the presence and activity update. Drawn at a fixed
// size and scaled to fit, so the cursor coordinates below stay simple.
const WIDTH = 1112;
const HEIGHT = 420;
const COLUMN_X = [16, 290, 564, 838];
const STEP_MS = 1100;
const LAST_STEP = 10;

const people = {
  maya: { name: 'Maya Chen', color: '#F76B15' },
  priya: { name: 'Priya Raman', color: '#8E4EC6' },
  daniel: { name: 'Daniel Okafor', color: '#0090FF' },
};

const cards = {
  'PLAT-20': {
    title: 'Due-date reminders at 9am local time',
    priority: 'medium',
    who: 'sofia',
    label: 'notifications',
  },
  'PLAT-17': { title: 'Cache board state for faster loads', priority: 'high', who: 'daniel', label: 'perf' },
  'PLAT-5': { title: 'Audit log export (CSV)', priority: 'low', label: 'api' },
  'PLAT-3': { title: 'Webhook retries with exponential backoff', priority: 'high', who: 'priya', label: 'api' },
  'PLAT-21': { title: 'Flaky test: socket fan-out', priority: 'medium', who: 'maya', label: 'bug' },
  'PLAT-2': { title: 'Rotate refresh tokens on every use', priority: 'high', who: 'daniel', label: 'security' },
  'PLAT-6': { title: 'Rate limit the public API', priority: 'high', who: 'priya', label: 'api' },
  'PLAT-8': { title: 'Signed upload URLs for attachments', priority: 'medium', who: 'maya', label: 'api' },
};

const avatarFor = { ...people, sofia: { name: 'Sofia Alvarez', color: '#12A594' } };

function columnsAt(step) {
  const plat3Moved = step >= 3;
  const plat20Moved = step >= 6;
  return {
    todo: [!plat20Moved && 'PLAT-20', 'PLAT-17', 'PLAT-5'].filter(Boolean),
    in_progress: [plat20Moved && 'PLAT-20', !plat3Moved && 'PLAT-3', 'PLAT-21'].filter(Boolean),
    in_review: [plat3Moved && 'PLAT-3', 'PLAT-2'].filter(Boolean),
    done: ['PLAT-6', 'PLAT-8'],
  };
}

const cursorPath = {
  priya: [[900, 330], [420, 84], [420, 84], [690, 84], [690, 84], [720, 250], [760, 290]],
  daniel: [[170, 320], [200, 230], [170, 250], [140, 84], [140, 84], [140, 84], [410, 84], [410, 84], [450, 230]],
};

const at = (path, step) => path[Math.min(step, path.length - 1)];

const activity = {
  4: { who: 'priya', text: 'moved PLAT-3 to In Review' },
  7: { who: 'daniel', text: 'started PLAT-20' },
};

export function HeroBoard() {
  const reduceMotion = useReducedMotion();
  const frame = useRef(null);
  const [scale, setScale] = useState(1);
  const [step, setStep] = useState(reduceMotion ? 4 : 0);
  const [cycle, setCycle] = useState(0);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / WIDTH)));
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  // Advance one step at a time. The last step fades the board out; then it snaps
  // back to the start (a fresh mount, so nothing animates in reverse) and fades in.
  useEffect(() => {
    if (reduceMotion) return;
    const timer =
      step < LAST_STEP
        ? setTimeout(() => setStep((s) => s + 1), STEP_MS)
        : setTimeout(() => {
            setCycle((c) => c + 1);
            setStep(0);
          }, 400);
    return () => clearTimeout(timer);
  }, [step, reduceMotion]);

  const columns = columnsAt(step);
  const lifted = (step === 2 || step === 3 ? 'PLAT-3' : null) ?? (step === 5 || step === 6 ? 'PLAT-20' : null);
  const latest = [...Object.entries(activity)].filter(([s]) => step >= Number(s)).at(-1)?.[1];

  return (
    <div ref={frame} className="w-full" style={{ height: HEIGHT * scale }} aria-hidden>
      <div
        className={cn(
          'origin-top-left overflow-hidden rounded-xl border border-line bg-canvas shadow-[0_24px_60px_-24px_rgb(0_0_0/0.25)] transition-opacity duration-300',
          step === LAST_STEP && 'opacity-0',
        )}
        style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}
      >
        <div className="flex h-11 items-center gap-2 border-b border-line bg-surface px-4 text-[13px]">
          <span className="text-fg-muted">Northwind Labs</span>
          <span className="text-fg-faint">/</span>
          <span className="font-medium">Platform</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex">
              {Object.values(people).map((p) => (
                <span key={p.name} className="-ml-1.5 rounded-full ring-2 ring-surface first:ml-0">
                  <Avatar person={p} size={20} />
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span className="size-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-ok" />3 viewing
            </span>
          </div>
        </div>

        <div key={cycle} className="relative h-[376px]">
          <LayoutGroup>
            {Object.entries(columns).map(([status, ids], i) => (
              <div key={status} className="absolute top-4 w-[258px]" style={{ left: COLUMN_X[i] }}>
                <div className="flex h-7 items-center gap-2 px-1 text-[13px]">
                  <StatusIcon status={status} />
                  <span className="font-medium">{STATUS_LABEL[status]}</span>
                  <span className="text-xs text-fg-faint tabular-nums">{ids.length}</span>
                </div>
                <div className="mt-1 flex flex-col gap-2">
                  {ids.map((id) => (
                    <PreviewCard key={id} id={id} status={status} lifted={lifted === id} />
                  ))}
                </div>
              </div>
            ))}
          </LayoutGroup>

          <Cursor person={people.priya} position={at(cursorPath.priya, step)} />
          <Cursor person={people.daniel} position={at(cursorPath.daniel, step)} />

          <AnimatePresence>
            {latest && (
              <motion.div
                key={latest.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs shadow-pop"
              >
                <Avatar person={people[latest.who]} size={18} />
                <span>
                  <span className="font-medium">{people[latest.who].name.split(' ')[0]}</span>{' '}
                  <span className="text-fg-muted">{latest.text}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ id, status, lifted }) {
  const card = cards[id];
  return (
    <motion.div
      layout
      layoutId={id}
      animate={{ scale: lifted ? 1.04 : 1, rotate: lifted ? -1.5 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={cn('relative rounded-lg border border-line bg-surface px-3 py-2.5', lifted && 'z-10 shadow-lift')}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-fg-faint">{id}</span>
        {card.who && <Avatar person={avatarFor[card.who]} size={16} />}
      </div>
      <p className={cn('mt-1 truncate text-[13px] leading-5', status === 'done' && 'text-fg-muted')}>{card.title}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="flex h-[18px] items-center rounded-sm border border-line px-1">
          <PriorityIcon priority={card.priority} className="size-3" />
        </span>
        <span className="flex h-[18px] items-center rounded-sm border border-line px-1.5 text-[11px] text-fg-muted">
          {card.label}
        </span>
      </div>
    </motion.div>
  );
}

function Cursor({ person, position }) {
  const [x, y] = position;
  return (
    <motion.div
      className="pointer-events-none absolute top-0 left-0 z-20"
      initial={false}
      animate={{ x, y }}
      transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.8 }}
    >
      <svg width="16" height="18" viewBox="0 0 16 18" className="drop-shadow-sm">
        <path
          d="M1 1l5.2 15 2.3-6.2L14.8 7.6z"
          fill={person.color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="-mt-0.5 ml-3 block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white"
        style={{ backgroundColor: person.color }}
      >
        {person.name.split(' ')[0]}
      </span>
    </motion.div>
  );
}
