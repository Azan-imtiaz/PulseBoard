import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Moon, RotateCcw, Sun, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { setTheme, useTheme } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { EmptyState } from '@/components/States';
import { useAuth } from '@/features/auth/AuthProvider';
import { ROLE_ABILITIES, ROLE_LABEL, useDemoInfo } from './api';
import { steps } from './steps';

export function DemoPage() {
  const demo = useDemoInfo();

  useEffect(() => {
    document.title = 'Live demo · PulseBoard';
    return () => {
      document.title = 'PulseBoard';
    };
  }, []);

  return (
    <div className="min-h-svh bg-canvas">
      <DemoHeader />
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-24 md:pt-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg-muted">
            <span className="size-1.5 animate-[live-pulse_2s_ease-in-out_infinite] rounded-full bg-ok" />
            Live demo, no sign-up needed
          </p>
          <h1 className="mt-5 text-[36px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance md:text-5xl">
            Step into a real team's board.
          </h1>
          <p className="mt-5 text-lg leading-8 text-fg-muted">
            Margalla Labs is a six-person product team in Islamabad. Their workspace has three boards, a few weeks of
            history and working AI features. Pick a role to see what each person can do.
          </p>
        </div>

        {demo.isPending && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-80 rounded-xl" />
            ))}
          </div>
        )}

        {(demo.isError || (demo.data && !demo.data.available)) && (
          <EmptyState
            className="mt-10 rounded-xl border border-line bg-surface"
            title="The demo isn't set up on this server"
            body="Run `npm run demo:reset` in the backend to create it. You can still create your own account."
            action={
              <Link to="/register" className="text-sm font-medium underline-offset-4 hover:underline">
                Create an account
              </Link>
            }
          />
        )}

        {demo.data?.available && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {demo.data.personas.map((persona, i) => (
              <PersonaCard key={persona.role} persona={persona} recommended={i === 0} />
            ))}
          </div>
        )}

        <section className="mt-20">
          <h2 className="text-xl font-semibold tracking-tight">Things to try</h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            A checklist inside the app walks you through these, one click each.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.id} className="flex gap-3.5 rounded-xl border border-line bg-surface p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <step.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <span className="mr-1.5 font-mono text-2xs text-fg-faint">0{i + 1}</span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-fg-muted">{step.hint}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-10 flex items-start gap-2 text-sm text-fg-muted">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-fg-faint" />
          <span>
            The demo is shared with other visitors and resets regularly. Deleting workspaces and boards, changing
            members and uploading files are turned off; everything else works for real.
          </span>
        </p>
      </main>
    </div>
  );
}

function PersonaCard({ persona, recommended }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);
  const firstName = persona.name.split(' ')[0];
  const signedInForReal = auth.status === 'signed-in' && !auth.user.isDemo;

  async function enter() {
    setEntering(true);
    try {
      await auth.enterDemo(persona.role);
      navigate('/app');
    } catch (err) {
      toast.error(err.message);
      setEntering(false);
    }
  }

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-xl border bg-surface p-6 transition-colors',
        recommended ? 'border-accent/50 shadow-pop' : 'border-line hover:border-line-strong',
      )}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-6 rounded-full bg-accent px-2.5 py-0.5 text-2xs font-medium text-accent-fg">
          Start here
        </span>
      )}
      <div className="flex items-center gap-3">
        <Avatar person={persona} size={44} />
        <div className="min-w-0">
          <p className="font-semibold">{persona.name}</p>
          <p className="text-sm text-fg-muted">{persona.title}</p>
        </div>
      </div>
      <span className="mt-4 self-start rounded-md bg-subtle px-2 py-0.5 text-xs font-medium">
        {ROLE_LABEL[persona.role]}
      </span>
      <p className="mt-3 text-sm leading-6 text-fg-muted">{persona.summary}</p>
      <ul className="mt-4 mb-6 space-y-2 text-sm">
        {ROLE_ABILITIES[persona.role].map(([allowed, text]) => (
          <li key={text} className={cn('flex items-center gap-2', !allowed && 'text-fg-faint')}>
            {allowed ? <Check className="size-3.5 text-ok" /> : <X className="size-3.5" />}
            {text}
          </li>
        ))}
      </ul>
      <Button
        variant={recommended ? 'primary' : 'secondary'}
        className="mt-auto h-9 w-full"
        loading={entering}
        onClick={enter}
      >
        Enter as {firstName}
        <ArrowRight className="size-3.5" />
      </Button>
      {signedInForReal && (
        <p className="mt-2 text-center text-2xs text-fg-faint">This signs you out of {auth.user.name}.</p>
      )}
    </article>
  );
}

function DemoHeader() {
  const theme = useTheme();
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5">
        <Link to="/" aria-label="PulseBoard home">
          <Logo />
        </Link>
        <Link to="/" className="ml-2 flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg">
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Back to home</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
          <Link to="/register" className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-fg-muted hover:text-fg">
            Create an account
          </Link>
        </div>
      </div>
    </header>
  );
}
