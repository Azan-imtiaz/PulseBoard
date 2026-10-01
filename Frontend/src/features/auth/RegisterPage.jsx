import { useCallback, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Input';
import { useAuth } from './AuthProvider';
import { AuthLayout, linkClass } from './AuthLayout';
import { PasswordField, PasswordStrength } from './PasswordField';
import { UsernameField, toUsername } from './UsernameField';
import { passwordProblem } from './passwordRules';
import { useSubmit } from './useSubmit';

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [usernameDraft, setUsernameDraft] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const onAvailabilityChange = useCallback((available) => setUsernameAvailable(available), []);

  // Until they type their own, the username follows the name they enter.
  const username = usernameDraft ?? toUsername(name);

  const { run, pending, error } = useSubmit(() => auth.register({ name, username, email, password }));

  if (auth.status === 'signed-in') return <Navigate to="/app" replace />;

  const weakPassword = passwordProblem(password, { email, username });
  const canSubmit = name.trim() && username && email && !weakPassword && usernameAvailable !== false;

  async function onSubmit(event) {
    event.preventDefault();
    const result = await run();
    if (result) navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="We'll email you a code to confirm it's you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input autoComplete="name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Username" hint="Used to sign in and for @mentions">
          <UsernameField
            value={username}
            name={name}
            onChange={setUsernameDraft}
            onAvailabilityChange={onAvailabilityChange}
          />
        </Field>

        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Password">
          <PasswordField autoComplete="new-password" required value={password} onChange={setPassword} />
          <PasswordStrength password={password} email={email} username={username} />
        </Field>

        {error && (
          <div className="text-sm text-danger">
            {error.message}
            {error.code === 'email_taken' && (
              <>
                {' '}
                <Link to="/login" className="underline underline-offset-4">
                  Sign in
                </Link>
              </>
            )}
            {error.details?.suggestions?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {error.details.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUsernameDraft(s)}
                    className="h-6 rounded-md border border-line px-2 text-xs text-fg hover:bg-subtle"
                  >
                    @{s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={pending} disabled={!canSubmit}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
