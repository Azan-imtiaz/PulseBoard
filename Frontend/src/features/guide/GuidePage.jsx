import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Bell,
  Bot,
  ChevronsUpDown,
  Command as CommandIcon,
  Crown,
  GitBranch,
  KanbanSquare,
  Layers,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { modKey } from '@/lib/format';
import { setTheme, useTheme } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Kbd } from '@/components/Kbd';
import { Logo } from '@/components/Logo';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/Menu';
import { useAuth } from '@/features/auth/AuthProvider';
import { openContactDialog } from '@/features/contact/store';
import { author } from '@/lib/author';
import { StatusIcon, PriorityIcon } from '@/features/tasks/meta';

// Every example in this guide follows the same two people, at the same
// fictional company, so the scenarios build on each other instead of
// introducing a new cast every section.
const HAMZA = { name: 'Hamza', color: 'var(--accent)' };
const SHIZA = { name: 'Shiza', color: '#c2750a' };

const SECTIONS = [
  { id: 'welcome', label: 'Welcome', icon: BookOpen },
  { id: 'shape', label: 'How it all fits together', icon: Layers },
  { id: 'workspace', label: 'Workspaces, members & roles', icon: UserPlus },
  { id: 'boards', label: 'Boards', icon: KanbanSquare },
  { id: 'tasks', label: 'Tasks, statuses & priority', icon: Sparkles },
  { id: 'together', label: 'Comments, mentions & files', icon: MessageSquare },
  { id: 'dependencies', label: 'Task dependencies', icon: GitBranch },
  { id: 'notifications', label: 'Notifications & live updates', icon: Bell },
  { id: 'command', label: 'The command palette', icon: CommandIcon },
  { id: 'ai', label: 'The AI assistant', icon: Bot },
  { id: 'not-yet', label: "What's not here yet", icon: Radio },
  { id: 'glossary', label: 'Glossary', icon: Search },
];

export function GuidePage() {
  const scrollRef = useRef(null);
  const [activeId, setActiveId] = useState('welcome');

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { root, rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-svh flex-col bg-canvas">
      <GuideHeader />
      <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl gap-12 px-6 py-10 sm:px-10">
          <nav className="sticky top-10 hidden h-fit w-52 shrink-0 lg:block">
            <p className="mb-3 px-2.5 text-2xs font-medium text-fg-faint">On this page</p>
            <ul className="space-y-0.5">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      activeId === id ? 'bg-hover font-medium text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 max-w-2xl flex-1 pb-24">
            <Hero />
            <Shape />
            <WorkspaceRoles />
            <Boards />
            <Tasks />
            <Together />
            <Dependencies />
            <Notifications />
            <CommandPaletteSection />
            <Ai />
            <NotYet />
            <Glossary />
          </div>
        </div>
      </div>
    </div>
  );
}

// Works whether the visitor is signed in, signed out, or the session is still
// resolving — this page is reachable either way, so it can't assume a workspace
// or a logged-in shell exists.
function GuideHeader() {
  const { status, user, logout } = useAuth();
  const theme = useTheme();
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas px-5">
      <Link to="/" aria-label="PulseBoard home" className="flex items-center gap-2">
        <Logo />
      </Link>
      <span className="text-sm text-fg-faint">/</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
        <BookOpen className="size-3.5" />
        Guide
      </span>

      <div className="ml-auto flex items-center gap-2">
        <IconButton label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setTheme(dark ? 'light' : 'dark')}>
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
        {status === 'signed-in' && (
          <>
            <Link
              to="/app"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Open PulseBoard <ArrowRight className="size-3.5" />
            </Link>
            <Menu>
              <MenuTrigger className="flex h-8 items-center gap-1.5 rounded-md px-1.5 outline-none hover:bg-hover data-[state=open]:bg-hover">
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
          </>
        )}
        {status === 'signed-out' && (
          <>
            <Link to="/login" className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-fg-muted hover:text-fg">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------- shared bits

function Section({ id, eyebrow, title, children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="scroll-mt-8 border-b border-line py-14 first:pt-0 last:border-b-0"
    >
      {eyebrow && <p className="mb-2 text-2xs font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold tracking-tight text-fg">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-fg-muted [&_b]:font-semibold [&_b]:text-fg [&_i]:text-fg [&_i]:not-italic [&_i]:font-medium">
        {children}
      </div>
    </motion.section>
  );
}

function Example({ person = HAMZA, children }) {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-subtle/60 p-4">
      <Avatar person={person} size={26} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-2xs font-semibold tracking-wide text-fg-faint uppercase">For example</p>
        <p className="text-sm leading-relaxed text-fg">{children}</p>
      </div>
    </div>
  );
}

function Term({ name, children }) {
  return (
    <div>
      <p className="font-semibold text-fg">{name}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------- content

function Hero() {
  return (
    <div id="welcome" className="scroll-mt-8 pb-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-subtle px-3 py-1 text-2xs font-medium text-fg-muted">
          <BookOpen className="size-3.5" />
          The PulseBoard guide
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-fg">
          Everything on your board, <span className="text-accent">explained</span>.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-fg-muted">
          Every word you don't recognize yet &mdash; <i>Backlog</i>, <i>Assignee</i>, <i>In Review</i> &mdash; and
          every button you haven't clicked. No jargon left unexplained, and a real example for every single one of
          them.
        </p>
      </motion.div>
      <p className="mt-6 max-w-xl text-sm text-fg-faint">
        Every example below follows the same two people at a made-up company, so nothing here is about a real
        client of yours &mdash; it's just <Avatar person={HAMZA} size={16} className="inline-block align-[-3px]" />{' '}
        <b className="text-fg-muted">Hamza</b>, who runs a small design studio, and{' '}
        <Avatar person={SHIZA} size={16} className="inline-block align-[-3px]" /> <b className="text-fg-muted">Shiza</b>,
        who works with them.
      </p>
    </div>
  );
}

function Shape() {
  return (
    <Section id="shape" eyebrow="The big picture" title="Three boxes, nested inside each other">
      <p>
        Before any of the terminology makes sense, it helps to see the shape of the whole thing. PulseBoard is
        three ideas, stacked inside one another like a set of folders:
      </p>

      <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Layers,
            name: 'Workspace',
            desc: "The whole company's home base. Everything else lives inside one.",
          },
          {
            icon: KanbanSquare,
            name: 'Board',
            desc: "One project's work area, made of columns and cards.",
          },
          {
            icon: Sparkles,
            name: 'Task',
            desc: 'One single card &mdash; one job that needs doing.',
          },
        ].map(({ icon: Icon, name, desc }, i) => (
          <div key={name} className="relative rounded-xl border border-line bg-surface p-4">
            <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon className="size-4" />
            </div>
            <p className="font-semibold text-fg">
              {i + 1}. {name}
            </p>
            <p className="mt-1 text-sm text-fg-muted" dangerouslySetInnerHTML={{ __html: desc }} />
          </div>
        ))}
      </div>

      <Example>
        Hamza's company, Northlight Studio, is one <b>Workspace</b>. Inside it there are two <b>Boards</b>: "Client
        Projects" (one card per client job) and "Studio Ops" (internal chores, like renewing software licenses).
        Every card on those boards &mdash; "Redesign homepage for Bloom &amp; Co," say &mdash; is a <b>Task</b>.
      </Example>

      <p>
        Everyone Hamza adds to the workspace can see <b>every</b> board inside it &mdash; there's no way to hide the
        "Client Projects" board from one person while showing it to another. If two teams genuinely shouldn't see
        each other's work, they'd need two separate workspaces, not two boards in the same one.
      </p>
    </Section>
  );
}

function RoleBadge({ role }) {
  const styles = {
    owner: 'bg-fg text-canvas',
    admin: 'bg-accent-soft text-accent',
    member: 'bg-subtle text-fg-muted',
  };
  const icons = { owner: Crown, admin: ShieldCheck, member: User };
  const Icon = icons[role];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold capitalize', styles[role])}>
      <Icon className="size-3.5" />
      {role}
    </span>
  );
}

function WorkspaceRoles() {
  return (
    <Section id="workspace" eyebrow="Who can do what" title="Workspaces, members & the three roles">
      <Term name="Workspace">
        The top-level container &mdash; think "the whole studio's account." The moment someone confirms their
        email for the first time, PulseBoard quietly creates a personal workspace for them. Hamza renamed his to
        "Northlight Studio" and started adding people to it.
      </Term>

      <Term name="Adding someone">
        On the Members page, an Admin or Owner types a colleague's email and picks a role for them. This only
        works if that email already belongs to a verified PulseBoard account &mdash; there's no "invite pending"
        state to wait on. If the account doesn't exist yet, adding them simply fails until they sign up first.
      </Term>

      <Example person={SHIZA}>
        Hamza tries to add Shiza to Northlight Studio using her email. Because Shiza already signed up and
        confirmed her email last week, she's added instantly and can see the workspace the next time she refreshes.
      </Example>

      <p>Every member has exactly one of three roles, and the role decides what they're allowed to touch:</p>

      <div className="not-prose my-2 space-y-3">
        {[
          {
            role: 'owner',
            title: 'Whoever started the workspace',
            desc: 'Can do anything, including permanently deleting the whole workspace. There is currently no way to hand this role to someone else.',
            example: 'Hamza created Northlight Studio, so he is its Owner.',
          },
          {
            role: 'admin',
            title: 'Runs boards and people below them',
            desc: 'Can create boards, add or remove members ranked below them, and delete any task on a board — not just their own.',
            example: 'Hamza makes Shiza an Admin once she starts managing the studio’s client roster herself.',
          },
          {
            role: 'member',
            title: 'Does the actual work',
            desc: 'Can create and work on tasks, but can only delete a task they personally created — and can’t create new boards or manage anyone.',
            example: 'A freelance illustrator brought on for one project is added as a Member: full access to work on tasks, nothing else.',
          },
        ].map(({ role, title, desc, example }) => (
          <div key={role} className="flex gap-4 rounded-lg border border-line p-4">
            <RoleBadge role={role} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{title}</p>
              <p className="mt-1 text-sm text-fg-muted">{desc}</p>
              <p className="mt-2 text-sm text-fg-faint italic">{example}</p>
            </div>
          </div>
        ))}
      </div>

      <p>
        One rule worth remembering: nobody can be promoted to Owner through the role menu &mdash; ownership
        transfer just isn't built yet. And a person can only manage or promote someone who currently ranks{' '}
        <i>below</i> them, so an Admin can never touch another Admin.
      </p>

      <div className="not-prose overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-subtle text-left text-fg-muted">
              <th className="px-3 py-2 font-medium">Can they&hellip;</th>
              <th className="px-3 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium">Admin</th>
              <th className="px-3 py-2 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {[
              ['Work on tasks', 'Yes', 'Yes', 'Yes'],
              ['Delete a task', 'Only their own', 'Any task', 'Any task'],
              ['Create a board', 'No', 'Yes', 'Yes'],
              ['Add or remove members', 'No', 'Below their rank', 'Yes'],
              ['Delete the workspace', 'No', 'No', 'Yes'],
            ].map(([action, m, a, o]) => (
              <tr key={action}>
                <td className="px-3 py-2 text-fg">{action}</td>
                <td className="px-3 py-2 text-fg-muted">{m}</td>
                <td className="px-3 py-2 text-fg-muted">{a}</td>
                <td className="px-3 py-2 text-fg-muted">{o}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Boards() {
  return (
    <Section id="boards" eyebrow="One per project" title="Boards">
      <p>
        A <b>Board</b> is one project's work area: columns across the top, task cards underneath, moving right as
        work gets done. Every board gets a short <b>Key</b> &mdash; a few letters that become the prefix on every
        task's id.
      </p>
      <Example>
        Hamza creates a board called "Client Projects" and gives it the key <b>CLNT</b>. Every task on it gets an
        id like <b>CLNT-1</b>, <b>CLNT-2</b>, <b>CLNT-14</b> &mdash; so when Shiza says "did you see CLNT-14?" in
        Slack, everyone knows exactly which card she means.
      </Example>
      <p>Only Admins and Owners can create a new board. Anyone in the workspace can open and work on one that already exists.</p>
      <p className="text-fg-faint">
        Two things boards don't do yet, so you're not left hunting for the button: there's no archiving (a board
        can only be permanently deleted, taking its tasks and history with it), and a board itself never has a
        status &mdash; only the tasks inside it do.
      </p>
    </Section>
  );
}

const STATUSES = [
  {
    id: 'backlog',
    what: "Noted down, but nobody's touched it yet. Every new task starts here.",
    example: 'Hamza jots down "Redesign the studio’s own portfolio site" in March, knowing it won’t start for months. It sits in Backlog as a placeholder.',
  },
  {
    id: 'todo',
    what: "Scheduled next, but work hasn't started. The deliberate “up next” pile.",
    example: 'Once Bloom & Co signs off on the brief, Hamza drags "Redesign homepage — Bloom & Co" from Backlog into Todo.',
  },
  {
    id: 'in_progress',
    what: 'Someone is actively working on it, right now.',
    example: 'Shiza opens the design file and starts on the homepage — she drags the card into In Progress the moment she begins.',
  },
  {
    id: 'blocked',
    what: 'Stalled, waiting on something outside your control.',
    example: "Shiza can't finish the homepage because Bloom & Co still hasn't sent their logo files. She moves the card to Blocked so everyone sees why it's stuck at a glance.",
  },
  {
    id: 'in_review',
    what: "Finished, but waiting on someone else's check before it's truly done.",
    example: 'Shiza wraps up the homepage and moves it to In Review so Hamza can sign off before it goes live.',
  },
  {
    id: 'done',
    what: 'Fully complete. Nothing left to do.',
    example: 'Hamza reviews it, approves it, and moves the card to Done. PulseBoard quietly records the completion date.',
  },
];

const PRIORITIES = [
  { id: 'none', label: 'No priority', what: 'The default. Nobody has judged its urgency yet.' },
  { id: 'low', label: 'Low', what: 'Nice to get to eventually — no pressure.' },
  { id: 'medium', label: 'Medium', what: 'Normal, ordinary-pace work.' },
  { id: 'high', label: 'High', what: 'Should happen soon, ahead of routine work.' },
  { id: 'urgent', label: 'Urgent', what: 'Drop-everything territory.' },
];

function Tasks() {
  return (
    <Section id="tasks" eyebrow="Where the work happens" title="Tasks: statuses, priority & everything on one">
      <p>
        A <b>Task</b> is one card &mdash; one job. Click "New task" (or just press <Kbd>C</Kbd> while a board is
        open) and fill in a title, an optional description, and quick pickers for status, priority, assignee, and
        a due date.
      </p>

      <h3 className="pt-2 text-base font-semibold text-fg">Status: the six stages every task moves through</h3>
      <p>
        A task is always in exactly one status, shown as the column it sits in. You move it by dragging the card
        into a new column &mdash; or, without a mouse, picking it up with <Kbd>Space</Kbd> and nudging it with the
        arrow keys.
      </p>

      <div className="not-prose my-2 divide-y divide-line rounded-lg border border-line">
        {STATUSES.map((s) => (
          <div key={s.id} className="flex gap-4 p-4">
            <div className="flex h-6 shrink-0 items-center gap-2 rounded-md bg-subtle px-2 text-xs font-medium text-fg">
              <StatusIcon status={s.id} />
              {STATUS_TITLE[s.id]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg-muted">{s.what}</p>
              <p className="mt-1.5 text-sm text-fg-faint italic">{s.example}</p>
            </div>
          </div>
        ))}
      </div>

      <p>
        PulseBoard won't let a card jump anywhere you like &mdash; a task can't leap straight from Backlog to
        Done. Try an invalid move and the column dims with "Can't move here." Two specific rules explain most
        "why won't this budge?" moments:
      </p>
      <ul className="ml-5 list-disc space-y-2 marker:text-fg-faint">
        <li>
          <b>You need an assignee before a task can become In Progress.</b> An empty task blocked with "Assign
          someone before starting this task."
        </li>
        <li>
          <b>A task can't become In Progress or Done while it's still waiting on another task.</b> More on this in
          the dependencies section just below.
        </li>
      </ul>
      <Example>
        Hamza tries to drag "Logo refresh — Cedar Robotics" straight into In Progress, but nobody's assigned to it
        yet. PulseBoard stops him: "Assign someone before starting this task." He picks Shiza as the assignee
        first, and the move goes through.
      </Example>

      <h3 className="pt-2 text-base font-semibold text-fg">Priority: how urgent, separately from how far along</h3>
      <p>Status is <i>what stage</i> a task is at. Priority is <i>how loudly it should shout for attention</i> &mdash; the two are independent.</p>
      <div className="not-prose my-2 divide-y divide-line rounded-lg border border-line">
        {PRIORITIES.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-3.5">
            <div className="flex h-6 w-32 shrink-0 items-center gap-2 rounded-md bg-subtle px-2 text-xs font-medium text-fg">
              <PriorityIcon priority={p.id} />
              {p.label}
            </div>
            <p className="text-sm text-fg-muted">{p.what}</p>
          </div>
        ))}
      </div>
      <Example person={SHIZA}>
        Bloom &amp; Co calls, panicked &mdash; their launch event moved up a week. Shiza marks "Redesign homepage —
        Bloom &amp; Co" as <PriorityIcon priority="urgent" className="inline-block align-[-2px]" /> <b>Urgent</b>,
        so it stands out from everything else on the board.
      </Example>

      <h3 className="pt-2 text-base font-semibold text-fg">Everything else a task can carry</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Term name="Assignee">Who's responsible. Shows their avatar on the card, or "Unassigned" if nobody's picked yet.</Term>
        <Term name="Due date">
          An optional deadline, shown in plain language &mdash; "Today," "Tomorrow," "3d overdue" &mdash; and
          colored accordingly.
        </Term>
        <Term name="Labels">
          Free-text colored tags you invent yourself. The same word is always the same color, so patterns emerge
          on their own.
        </Term>
        <Term name="Description">A free-text field for anything longer than fits in the title.</Term>
      </div>
    </Section>
  );
}

const STATUS_TITLE = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  in_review: 'In Review',
  done: 'Done',
};

function Together() {
  return (
    <Section id="together" eyebrow="Working as a team" title="Comments, @mentions & attachments">
      <Term name="Comments">
        Every task has its own conversation thread at the bottom of its detail panel. Type <b>@</b> and a username
        to bring up a live list of workspace members &mdash; picking one notifies them by email. Comments can't be
        edited or deleted once posted, so treat the thread as a permanent record, not a chat you can take back.
      </Term>
      <Example person={SHIZA}>
        On the Bloom &amp; Co homepage task, Shiza writes: "@azan can you confirm the final brand colors before I
        move on?" Hamza gets an email because he was mentioned, and replies right there in the thread &mdash; the
        whole exchange stays attached to that task forever.
      </Example>

      <Term name="Attachments">
        Files up to 25 MB, dropped straight onto the task or added with "Attach file." Anyone who opens the task
        later can see them, with no digging through email required.
      </Term>
      <Example>
        Hamza drags the client's signed contract PDF onto the "Redesign homepage — Bloom &amp; Co" task. Now
        anyone on the team can confirm the paperwork is in without asking him directly.
      </Example>
    </Section>
  );
}

function Dependencies() {
  return (
    <Section id="dependencies" eyebrow="Keeping the order honest" title="Task dependencies (“Depends on”)">
      <p>
        Sometimes one task genuinely can't move forward until another one finishes. <b>Depends on</b> lets you say
        so directly: mark Task A as depending on Task B, and PulseBoard won't let A become In Progress or Done
        while B is still open.
      </p>
      <Example>
        "Publish the new homepage" depends on "Get final copy approved by Bloom &amp; Co." As long as the approval
        task isn't Done, PulseBoard blocks the publish task with "Waiting on 1 open dependency" &mdash; a built-in
        guardrail against shipping before the client actually signed off.
      </Example>
      <p>
        A task can't depend on itself, dependencies have to live on the same board, and PulseBoard automatically
        refuses circular chains (A waits on B, which waits on A).
      </p>
    </Section>
  );
}

function Notifications() {
  return (
    <Section id="notifications" eyebrow="Staying in the loop" title="Notifications & live updates">
      <p>PulseBoard has no notification bell inside the app &mdash; every notification is an email, and there are exactly three triggers:</p>
      <ul className="ml-5 list-disc space-y-2 marker:text-fg-faint">
        <li><b>You're assigned (or reassigned) a task.</b></li>
        <li><b>Someone @mentions you in a comment.</b></li>
        <li><b>A task you own is due within 24 hours and isn't finished</b> &mdash; a one-time reminder, checked every 15 minutes.</li>
      </ul>
      <Example>
        Hamza assigns "File extension for Cedar Robotics" to Shiza with tomorrow's due date. She gets an "assigned
        to you" email right away, and &mdash; if it's still open by morning &mdash; one "due soon" reminder,
        never more than once.
      </Example>

      <h3 className="pt-2 text-base font-semibold text-fg">While a board is open, it's alive</h3>
      <p>
        No refresh button needed. A teammate's card moves, edits, and comments show up on your screen the moment
        they happen, and you can even watch their mouse cursor moving around the board with their name attached.
      </p>
      <Example person={SHIZA}>
        Hamza and Shiza both have "Client Projects" open at once. The instant Shiza drags a card from In Progress
        to In Review, it moves on Hamza's screen too &mdash; no refresh, no delay.
      </Example>
    </Section>
  );
}

function CommandPaletteSection() {
  return (
    <Section id="command" eyebrow="Never touch the mouse" title="The command palette">
      <p>
        Press <Kbd>{modKey}</Kbd> <Kbd>K</Kbd> from anywhere &mdash; or click "Search&hellip;" in the sidebar
        &mdash; and a single box opens that can jump to any task or board, fire off actions like "New task" or
        "Generate sprint report," or jump straight to Members, without your hands ever leaving the keyboard.
      </p>
      <Example>
        Hamza can't remember which board the Cedar Robotics task lives on. He hits <Kbd>{modKey}</Kbd> <Kbd>K</Kbd>,
        types "cedar," and the matching card appears instantly &mdash; one click and he's there.
      </Example>
    </Section>
  );
}

function Ai() {
  const items = [
    {
      title: 'Summarize a comment thread',
      desc: "Once a task has 3+ comments, a “Summarize” button appears. It reads the whole back-and-forth and hands back a short recap — what was discussed, what was decided, what's still open.",
      example: 'The Bloom & Co task has 14 comments about a color change. Instead of reading all of them, Hamza clicks "Summarize 14 comments" and gets five bullet points in seconds.',
    },
    {
      title: 'Sprint report',
      desc: 'A status report you’d otherwise write by hand: how many tasks shipped, how many are blocked, and a written paragraph explaining it — over the last 7, 14, or 28 days. The counts are always real numbers from your board; only the sentences around them are AI-written.',
      example: 'Every Friday, Hamza opens "Client Projects" and generates a report. It reads: "The team shipped 4 projects this week. The Cedar Robotics logo remains blocked on client feedback." He forwards it to his co-founder instead of typing a summary himself.',
    },
    {
      title: 'Suggested priorities',
      desc: "Looks at due dates, what each task is blocking, and how long it's been idle, then suggests priority changes with a one-line reason. Nothing changes until you tick “Apply.”",
      example: 'Hamza clicks "Prioritize." The AI suggests bumping "Website launch — Bloom & Co" to Urgent ("due in 2 days, blocking 1 other task") and leaves everything else alone. He applies just that one change.',
    },
  ];
  return (
    <Section id="ai" eyebrow="Optional, and opt-in" title="The AI assistant">
      <p>Three features, each triggered by a click &mdash; nothing runs on its own in the background, and each one shows exactly what it used to answer.</p>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-lg border border-line p-4">
            <p className="flex items-center gap-2 font-semibold text-fg">
              <Sparkles className="size-4 text-accent" />
              {item.title}
            </p>
            <p className="mt-1.5 text-sm text-fg-muted">{item.desc}</p>
            <p className="mt-2.5 text-sm text-fg-faint italic">{item.example}</p>
          </div>
        ))}
      </div>
      <p className="text-fg-faint">
        In plain terms: using any of these three sends the relevant task text and comments to the AI model so it
        can write the summary. The counts and charts themselves are always calculated by PulseBoard, never by the
        AI.
      </p>
    </Section>
  );
}

function NotYet() {
  const items = [
    ['No pending invitations', 'Adding a member either works instantly or fails outright — there’s no "invite sent, awaiting response" state.'],
    ['No in-app notification bell', 'Every notification is an email. There’s no feed to check inside the app itself.'],
    ['No editing or deleting comments', 'Once posted, a comment is permanent.'],
    ['No board archiving', 'A board can only be permanently deleted, not tucked away and kept.'],
    ['No ownership transfer', 'A workspace Owner can’t currently hand that role to someone else through the interface.'],
    ['No task "watchers"', 'You’re only notified about a task if you’re assigned to it or @mentioned in it.'],
  ];
  return (
    <Section id="not-yet" eyebrow="Setting expectations" title="What PulseBoard doesn't do yet">
      <p>So you're not hunting for a button that was never built, here's an honest list:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([title, desc]) => (
          <div key={title} className="rounded-lg border border-line bg-subtle/60 p-4">
            <p className="text-sm font-semibold text-fg">{title}</p>
            <p className="mt-1 text-sm text-fg-muted">{desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

const GLOSSARY = [
  ['@mention', 'Typing @username in a comment to notify someone by email and highlight them in the text.'],
  ['Assignee', 'The one person responsible for a task. "Unassigned" if nobody’s set.'],
  ['Attachment', 'A file, up to 25 MB, attached directly to a task.'],
  ['Backlog', 'The status for work that’s noted down but not scheduled. Where every new task starts.'],
  ['Blocked', 'The status meaning work has stalled, waiting on something outside your control.'],
  ['Board', 'One project’s work area inside a workspace — columns and cards.'],
  ['Board key', 'A short prefix, like CLNT, used to build every task id on that board (CLNT-12).'],
  ['Command palette', `The ${modKey}+K universal search-and-shortcut box.`],
  ['Depends on', 'A link saying one task can’t move to In Progress or Done until another linked task is Done first.'],
  ['Done', 'The status meaning a task is fully complete.'],
  ['Due date', 'An optional deadline, color-coded when it’s overdue or coming up soon.'],
  ['In Progress', 'The status meaning someone is actively working on it right now.'],
  ['In Review', 'The status meaning the work is finished but awaiting someone else’s approval.'],
  ['Label', 'A free-text colored tag you invent yourself to organize tasks your own way.'],
  ['Member', 'The base role: can create and work on tasks.'],
  ['Priority', 'How urgent a task is — No priority, Low, Medium, High, or Urgent — independent of its status.'],
  ['Sprint report', 'An AI-assisted activity report; the numbers come from PulseBoard, the write-up from AI.'],
  ['Status', 'The stage a task is in: Backlog, Todo, In Progress, Blocked, In Review, or Done.'],
  ['Task', 'One single piece of work — a card on a board.'],
  ['Todo', 'The status meaning work is scheduled next but not yet started.'],
  ['Workspace', 'The top-level container — the whole company’s space, holding all its boards and members.'],
];

function Glossary() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(([term, def]) => term.toLowerCase().includes(q) || def.toLowerCase().includes(q));
  }, [query]);

  return (
    <Section id="glossary" eyebrow="Quick reference" title="Glossary">
      <div className="not-prose relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a term…"
          className="h-9 w-full rounded-md border border-line bg-surface pr-3 pl-8 text-sm outline-none transition-colors hover:border-line-strong focus:border-accent focus:ring-3 focus:ring-accent-soft"
        />
      </div>

      <div className="not-prose mt-4 divide-y divide-line rounded-lg border border-line">
        {filtered.map(([term, def]) => (
          <div key={term} className="flex flex-col gap-0.5 p-3.5 sm:flex-row sm:gap-4">
            <p className="w-40 shrink-0 font-semibold text-fg">{term}</p>
            <p className="text-sm text-fg-muted">{def}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-fg-faint">No term matches "{query}".</p>}
      </div>

      <div className="mt-8 flex flex-col items-start gap-3 rounded-lg border border-line bg-subtle/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-fg">Still doesn't make sense?</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            This guide is meant to cover all of it &mdash; if something's still unclear, tell us directly.
          </p>
        </div>
        <Button variant="primary" className="shrink-0" onClick={openContactDialog}>
          <Mail className="size-3.5" />
          Contact the team
        </Button>
      </div>
      <p className="mt-6 text-sm text-fg-faint">
        PulseBoard is designed and built by{' '}
        <a href={author.links[0].href} target="_blank" rel="noreferrer" className="font-medium text-fg-muted hover:text-fg">
          {author.name}
        </a>
        .
      </p>
    </Section>
  );
}
