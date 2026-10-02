import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Input';
import { useAuth } from './AuthProvider';
import { AuthLayout, linkClass } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { useSubmit } from './useSubmit';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { run, pending, error } = useSubmit(() => auth.login(identifier, password));

  if (auth.status === 'signed-in') return <Navigate to={location.state?.from ?? '/app'} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    const session = await run();
    if (session !== undefined) navigate(location.state?.from ?? '/app', { replace: true });
  }

  // An unverified account gets a fresh code from the server; send them to enter it.
  if (error?.code === 'email_not_verified') {
    return (
      <Navigate
        to={`/verify-email?email=${encodeURIComponent(error.details.email)}`}
        replace
        state={{ from: location.state?.from, notice: error.message }}
      />
    );
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up where your team left off."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email or username">
          <Input
            autoComplete="username"
            required
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          hint={
            <Link
              to="/forgot-password"
              state={{ email: identifier.includes('@') ? identifier : '' }}
              className="hover:text-fg"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordField required value={password} onChange={setPassword} />
        </Field>
        {error && <p className="text-sm text-danger">{error.message}</p>}
        <Button type="submit" variant="primary" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>
      <Link
        to="/demo"
        className="group mt-6 flex items-center gap-3 rounded-lg border border-line px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-subtle"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
          <PlayCircle className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-fg">Just looking around?</span>
          <span className="block text-xs text-fg-muted">Try the live demo. No account needed.</span>
        </span>
        <ArrowRight className="size-4 text-fg-faint transition-transform group-hover:translate-x-0.5" />
      </Link>
    </AuthLayout>
  );
}
