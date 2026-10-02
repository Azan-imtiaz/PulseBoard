import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronsUpDown,
  LogOut,
  Mail,
  Menu as MenuIcon,
  Moon,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import { author } from '@/lib/author';
import { cn } from '@/lib/cn';
import { setTheme, useTheme } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/Menu';
import { useAuth } from '@/features/auth/AuthProvider';
import { openContactDialog } from '@/features/contact/store';
import { HeroBoard } from './HeroBoard';
import {
  NotificationsVisual,
  PaletteVisual,
  PresenceVisual,
  ReportVisual,
  RolesVisual,
  SignInVisual,
  WorkflowVisual,
} from './FeatureVisuals';

const primaryButton =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover';
const secondaryButton =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-subtle';

const sections = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'ai', label: 'AI' },
  { id: 'faq', label: 'FAQ' },
  { id: 'developer', label: 'Developer' },
];

export function HomePage() {
  useEffect(() => {
    document.title = 'PulseBoard: real-time task boards for software teams';
    return () => {
      document.title = 'PulseBoard';
    };
  }, []);

  return (
    <div className="min-h-svh bg-canvas text-fg">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <AiSection />
        <Faq />
        <Developer />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

// Signed-in visitors get a way back into the app instead of sign-in buttons.
function AuthActions({ compact }) {
  const { status, user, logout } = useAuth();
  if (status === 'loading') return <div className="h-9 w-40" />;

  if (status === 'signed-in') {
    return (
      <div className="flex items-center gap-2">
        <Link to="/app" className={cn(primaryButton, 'h-9')}>
          Open PulseBoard <ArrowRight className="size-4" />
        </Link>
        <Menu>
          <MenuTrigger className="flex h-9 items-center gap-1.5 rounded-md px-1.5 outline-none hover:bg-hover data-[state=open]:bg-hover">
            <Avatar person={user} size={22} />
            <ChevronsUpDown className="size-3.5 text-fg-faint" />
          </MenuTrigger>
          <MenuContent align="end" className="w-56">
            <MenuLabel>
              @{user.username} · {user.email}
            </MenuLabel>
            <MenuSeparator />
            <MenuItem icon={<LogOut className="size-3.5" />} onSelect={logout}>
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-fg-muted hover:text-fg"
      >
        Sign in
      </Link>
      <Link to="/register" className={cn(primaryButton, 'h-9')}>
        {compact ? 'Sign up' : 'Get started'}
      </Link>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex size-2 rounded-full bg-ok" />
    </span>
  );
}

// The demo gets its own button rather than another nav link: it's the main thing a
// first-time visitor should try.
function DemoButton({ className }) {
  return (
    <Link
      to="/demo"
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg',
        'transition-colors hover:border-line-strong hover:bg-subtle',
        className,
      )}
    >
      <LiveDot />
      Live demo
    </Link>
  );
}

function SiteHeader() {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A section anchor never triggers React Router's navigation, so the menu
  // has to close itself on click rather than relying on a route change.
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        scrolled || mobileOpen ? 'border-line bg-canvas/85 backdrop-blur-md' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-5">
        <Link to="/" aria-label="PulseBoard home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-sm text-fg-muted transition-colors hover:text-fg">
              {s.label}
            </a>
          ))}
          <Link to="/guide" className="text-sm text-fg-muted transition-colors hover:text-fg">
            Guide
          </Link>
          <button
            type="button"
            onClick={openContactDialog}
            className="text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Contact
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
          <DemoButton className="ml-1" />
          <div className="ml-1 hidden sm:block">
            <AuthActions compact />
          </div>
          <IconButton
            label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="ml-1 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-4" /> : <MenuIcon className="size-4" />}
          </IconButton>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3 sm:px-5">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={closeMobile}
                  className="rounded-md px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg"
                >
                  {s.label}
                </a>
              ))}
              <Link
                to="/guide"
                onClick={closeMobile}
                className="rounded-md px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg"
              >
                Guide
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  openContactDialog();
                }}
                className="rounded-md px-2 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg"
              >
                Contact
              </button>
              <div className="mt-2 border-t border-line pt-3 sm:hidden">
                <AuthActions />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  const { status } = useAuth();

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:22px_22px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg-muted">
            <span className="size-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-ok" />
            Real-time task boards for software teams
          </p>
          <h1 className="mt-6 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-balance md:text-[64px]">
            Your whole team on one board, <span className="text-fg-muted">in real time.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-fg-muted">
            PulseBoard keeps every card, comment and cursor in sync the moment it changes, makes sure work moves through
            the right steps, and writes your sprint report for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {status === 'signed-in' ? (
              <Link to="/app" className={primaryButton}>
                Open your workspace <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link to="/demo" className={primaryButton}>
                  Try the live demo <ArrowRight className="size-4" />
                </Link>
                <Link to="/register" className={secondaryButton}>
                  Create your workspace
                </Link>
              </>
            )}
          </div>
          {status !== 'signed-in' && (
            <p className="mt-4 text-sm text-fg-faint">
              The demo needs no sign-up. Explore as an owner, an admin or a member.
            </p>
          )}
        </div>

        <div className="mt-16">
          <HeroBoard />
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, body, id }) {
  return (
    <div className="max-w-2xl scroll-mt-24" id={id}>
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance md:text-4xl">
        {title}
      </h2>
      {body && <p className="mt-4 text-base leading-7 text-fg-muted">{body}</p>}
    </div>
  );
}

const features = [
  {
    title: 'Everyone sees the same board',
    body: 'Changes show up for everyone within a second. See who is looking at the board, and where their cursor is.',
    visual: PresenceVisual,
    span: 'md:col-span-2',
  },
  {
    title: 'Work follows your process',
    body: "Tasks can't start without an owner, can't skip review, and wait on the tasks they depend on.",
    visual: WorkflowVisual,
  },
  {
    title: 'Sprint reports, written for you',
    body: 'Real numbers from your board, with a plain-English summary of what shipped and what is stuck.',
    visual: ReportVisual,
  },
  {
    title: 'Built for the keyboard',
    body: 'Press Ctrl K to jump to any board or task, and C to create one without reaching for the mouse.',
    visual: PaletteVisual,
  },
  {
    title: 'The right people, the right access',
    body: 'Owners, admins and members. Permissions are checked by the server on every request, not just hidden in the UI.',
    visual: RolesVisual,
  },
  {
    title: 'Accounts you can trust',
    body: 'Every sign-up confirms their email with a one-time code. Unique usernames make @mentions unambiguous.',
    visual: SignInVisual,
  },
  {
    title: 'Files and notifications',
    body: 'Attach files up to 25 MB to any task. People get an email when they are assigned, mentioned, or a task is due within a day.',
    visual: NotificationsVisual,
    span: 'lg:col-span-2',
  },
];

function Features() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <SectionHeading
          id="features"
          eyebrow="Features"
          title="Everything a team needs to plan, track and ship."
          body="No setup project, no plugin marketplace. The essentials, done properly."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, body, visual: Visual, span }) => (
            <article
              key={title}
              className={cn('flex flex-col overflow-hidden rounded-xl border border-line bg-canvas', span)}
            >
              <div className="flex-1 border-b border-line">
                <Visual />
              </div>
              <div className="p-5">
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-fg-muted">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    title: 'Create your workspace',
    body: 'Sign up with your email and pick a username. Your own workspace is ready as soon as you confirm the code we send.',
  },
  {
    title: 'Add boards and your team',
    body: 'Make a board for each team or project, then add teammates by email as members or admins.',
  },
  {
    title: 'Work together, live',
    body: 'Drag cards, comment, @mention people and watch the board update for everyone as it happens.',
  },
];

function HowItWorks() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <SectionHeading id="how-it-works" eyebrow="How it works" title="Up and running in a few minutes." />
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t border-line-strong pt-5">
              <span className="font-mono text-xs text-fg-faint">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const aiPoints = [
  ['Summarize a long thread', 'One click turns dozens of comments into the current state, decisions and next owner.'],
  [
    'Write the sprint report',
    'Shipped, in flight, blocked and weekly velocity, with a short write-up you can paste anywhere.',
  ],
  [
    'Suggest priorities',
    'Flags work that is overdue, blocking others or going stale, and lets you accept each change.',
  ],
];

function AiSection() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
        <div>
          <SectionHeading
            id="ai"
            eyebrow="AI assistant"
            title="Less status-meeting, more shipping."
            body="The numbers always come from your board's real activity. The AI only writes the words around them, so reports stay accurate."
          />
          <dl className="mt-10 space-y-6">
            {aiPoints.map(([title, body]) => (
              <div key={title} className="flex gap-4">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <div>
                  <dt className="font-medium">{title}</dt>
                  <dd className="mt-1 text-sm leading-6 text-fg-muted">{body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-6" aria-hidden>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Sprint report</span>
            <span className="text-xs text-fg-faint">Last 14 days</span>
          </div>
          <div className="mt-5 grid grid-cols-4 divide-x divide-line rounded-lg border border-line bg-surface">
            {[
              ['Shipped', 6],
              ['In flight', 4],
              ['Blocked', 2],
              ['Created', 15],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-3">
                <p className="text-[11px] text-fg-muted">{label}</p>
                <p className={cn('mt-0.5 text-xl font-semibold tabular-nums', label === 'Blocked' && 'text-danger')}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex h-24 items-end gap-2">
            {[0, 2, 2, 2, 3, 6].map((n, i, all) => (
              <div
                key={i}
                className={cn('flex-1 rounded-sm', i === all.length - 1 ? 'bg-accent' : 'bg-line-strong')}
                style={{ height: `${Math.max(4, (n / 6) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-4 text-sm leading-6">
            <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">Summary</p>
            <p className="mt-1.5 text-fg-muted">
              Six tasks shipped, led by the API rate limits and signed uploads. Two items are blocked on the session
              store migration, which is the one to watch next week.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  [
    'Who can see my boards?',
    'Only people in your workspace. Anyone outside it gets a "not found" response, even if they have the link.',
  ],
  [
    'What can members do, compared with admins?',
    'Members create and work on tasks and can delete the ones they created. Admins also manage boards and members. The owner can do everything, including making admins.',
  ],
  [
    'How does the AI work with my data?',
    'When you ask for a summary, report or priority suggestions, the relevant tasks and comments are sent to the AI model to write the text. Counts and velocity are calculated by PulseBoard itself.',
  ],
  [
    'Why do I need to confirm my email?',
    'It proves the address is yours, so teammates can add you by email and notifications reach the right person. The code expires after 10 minutes.',
  ],
  [
    'Can I sign in with my username?',
    'Yes. You can sign in with either your email address or your username. If you forget your password, reset it with a code sent to your email.',
  ],
  [
    'Is there an API?',
    'Yes. Everything the app does goes through a documented REST API, with a reference page you can open from the footer.',
  ],
];

function Faq() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[1fr_2fr]">
        <SectionHeading id="faq" eyebrow="FAQ" title="Questions, answered." />
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {question}
                <Plus className="size-4 shrink-0 text-fg-faint transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const stack = [
  ['Backend', 'Node.js, Express 5, MongoDB, Socket.IO, Zod'],
  ['Frontend', 'React 19, Vite, Tailwind CSS 4, TanStack Query'],
  ['Infrastructure', 'JWT auth, S3 uploads, SMTP email, OpenAPI docs'],
];

function AuthorPhoto() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-fg">
        {author.name[0]}
      </span>
    );
  }
  return (
    <img
      src={author.photo}
      alt={author.name}
      onError={() => setFailed(true)}
      className="size-13 shrink-0 rounded-full border border-line object-cover"
    />
  );
}

function Developer() {
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading
            id="developer"
            eyebrow="Behind the project"
            title="Designed and built by one developer."
            body="PulseBoard is a full-stack project: the API, realtime layer, permission model, AI integration and interface were all written from scratch."
          />
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {stack.map(([area, tools]) => (
              <div key={area} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
                <dt className="w-32 shrink-0 text-sm font-medium">{area}</dt>
                <dd className="text-sm text-fg-muted">{tools}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="self-start rounded-xl border border-line bg-canvas p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <AuthorPhoto />
            <div>
              <p className="text-lg font-semibold tracking-tight">{author.name}</p>
              <p className="text-sm text-fg-muted">
                {author.role} · {author.location}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-fg-muted">
            Software Engineering graduate from Arid University (2025), currently working as a blockchain developer at
            Infinity Blockchain Solutions. Alongside smart contracts and dApp frontends, I build Node.js and Express
            backends with role-based access control, admin dashboards and LLM-powered features. I also share MERN and
            blockchain tutorials on YouTube.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {author.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium transition-colors hover:border-line-strong"
              >
                {link.label}
                <ArrowUpRight className="size-3.5 text-fg-faint" />
              </a>
            ))}
            <a
              href={`mailto:${author.email}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium transition-colors hover:border-line-strong"
            >
              <Mail className="size-3.5 text-fg-faint" />
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { status } = useAuth();
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] md:text-4xl">Get your team on the same page.</h2>
          <p className="mt-3 text-fg-muted">Create a workspace now. Invite your team when you're ready.</p>
        </div>
        {status === 'signed-in' ? (
          <Link to="/app" className={primaryButton}>
            Open PulseBoard <ArrowRight className="size-4" />
          </Link>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className={primaryButton}>
              Create your workspace
            </Link>
            <Link to="/demo" className={secondaryButton}>
              Try the live demo
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-fg-muted">Real-time task boards for software teams.</p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-6 text-sm sm:gap-x-16">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fg-faint">Product</p>
            <a href="#features" className="text-fg-muted hover:text-fg">
              Features
            </a>
            <a href="#how-it-works" className="text-fg-muted hover:text-fg">
              How it works
            </a>
            <a href="/docs" className="text-fg-muted hover:text-fg">
              API reference
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fg-faint">Support</p>
            <Link to="/guide" className="text-fg-muted hover:text-fg">
              Guide
            </Link>
            <button type="button" onClick={openContactDialog} className="text-left text-fg-muted hover:text-fg">
              Contact us
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fg-faint">Account</p>
            <Link to="/login" className="text-fg-muted hover:text-fg">
              Sign in
            </Link>
            <Link to="/register" className="text-fg-muted hover:text-fg">
              Create account
            </Link>
            <Link to="/forgot-password" className="text-fg-muted hover:text-fg">
              Reset password
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 pb-10 text-xs text-fg-faint sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} PulseBoard</span>
        <span>
          Designed and built by{' '}
          <a href={author.links[0].href} target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg">
            {author.name}
          </a>
        </span>
      </div>
    </footer>
  );
}
