import { Link } from 'react-router';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { setTheme, useTheme } from '@/lib/theme';

export function AuthLayout({ title, subtitle, children, footer }) {
  const theme = useTheme();
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-5">
        <Link to="/" aria-label="PulseBoard home" className="flex items-center gap-2">
          <Logo />
        </Link>
        <Link
          to="/"
          className="ml-2 flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Back to home</span>
        </Link>
        <IconButton
          label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          className="ml-auto"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-[360px]">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <p className="mt-6 text-sm text-fg-muted">{footer}</p>}
        </div>
      </div>
    </div>
  );
}

export const linkClass = 'font-medium text-fg underline-offset-4 hover:underline';
