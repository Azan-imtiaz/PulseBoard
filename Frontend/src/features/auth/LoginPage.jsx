import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
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
      {import.meta.env.DEV && (
        <div className="mt-6 rounded-lg border border-dashed border-line px-3 py-2.5 text-xs leading-5 text-fg-muted">
          Seeded demo: <span className="font-mono text-fg">maya</span> /{' '}
          <span className="font-mono text-fg">pulseboard</span>
        </div>
      )}
    </AuthLayout>
  );
}
