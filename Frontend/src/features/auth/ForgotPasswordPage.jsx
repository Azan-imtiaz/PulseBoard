import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Input';
import { useAuth } from './AuthProvider';
import { AuthLayout, linkClass } from './AuthLayout';
import { OtpInput } from './OtpInput';
import { PasswordField, PasswordStrength } from './PasswordField';
import { passwordProblem } from './passwordRules';
import { useCooldown } from './useCooldown';
import { useSubmit } from './useSubmit';

export function ForgotPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [cooldown, setCooldown] = useCooldown(0);

  const request = useSubmit(() => api('/auth/forgot-password', { method: 'POST', body: { email } }));
  const reset = useSubmit(() => auth.resetPassword(email, code, password));

  if (auth.status === 'signed-in') return <Navigate to="/app" replace />;

  async function sendCode(event) {
    event?.preventDefault();
    if (await request.run()) {
      setStep('reset');
      setCooldown(60);
    }
  }

  async function onReset(event) {
    event.preventDefault();
    if ((await reset.run()) !== undefined) {
      toast.success('Password changed. You’ve been signed out everywhere else.');
      navigate('/app', { replace: true });
    }
  }

  if (step === 'email') {
    return (
      <AuthLayout
        title="Reset your password"
        subtitle="Enter your account's email and we'll send you a code."
        footer={
          <Link to="/login" className={linkClass}>
            Back to sign in
          </Link>
        }
      >
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {request.error && <p className="text-sm text-danger">{request.error.message}</p>}
          <Button type="submit" variant="primary" className="w-full" loading={request.pending}>
            Send code
          </Button>
        </form>
      </AuthLayout>
    );
  }

  const weak = passwordProblem(password, { email });

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={
        <>
          If <span className="font-medium text-fg">{email}</span> has an account, we sent it a 6-digit code.
        </>
      }
      footer={
        <button type="button" onClick={() => setStep('email')} className={linkClass}>
          Use a different email
        </button>
      }
    >
      <form onSubmit={onReset} className="space-y-4">
        <Field label="Code from the email">
          <OtpInput value={code} onChange={setCode} invalid={reset.error?.code?.startsWith('otp')} />
        </Field>
        <Field label="New password">
          <PasswordField autoComplete="new-password" required value={password} onChange={setPassword} />
          <PasswordStrength password={password} email={email} />
        </Field>
        {reset.error && <p className="text-sm text-danger">{reset.error.message}</p>}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={reset.pending}
          disabled={code.length !== 6 || !!weak}
        >
          Change password
        </Button>
        <p className="text-center text-sm text-fg-muted">
          {cooldown > 0 ? (
            <span className="tabular-nums">You can resend the code in {cooldown}s</span>
          ) : (
            <button type="button" onClick={sendCode} className={linkClass}>
              Send a new code
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
