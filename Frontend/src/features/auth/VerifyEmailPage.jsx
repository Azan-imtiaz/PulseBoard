import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { useAuth } from './AuthProvider';
import { AuthLayout, linkClass } from './AuthLayout';
import { OtpInput } from './OtpInput';
import { useCooldown } from './useCooldown';
import { useSubmit } from './useSubmit';

export function VerifyEmailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const [code, setCode] = useState('');
  // A code was sent just before we got here, so resending starts on cooldown.
  const [cooldown, setCooldown] = useCooldown(60);

  const verify = useSubmit((value) => auth.verifyEmail(email, value));
  const resend = useSubmit(async () => {
    try {
      return await api('/auth/resend-verification', { method: 'POST', body: { email } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'otp_cooldown') setCooldown(err.details.retryAfter ?? 60);
      throw err;
    }
  });

  if (auth.status === 'signed-in') return <Navigate to={location.state?.from ?? '/app'} replace />;
  if (!email) return <Navigate to="/register" replace />;

  async function submit(value = code) {
    if (value.length !== 6) return;
    const session = await verify.run(value);
    if (session !== undefined) {
      toast.success('Email confirmed. Welcome to PulseBoard!');
      navigate(location.state?.from ?? '/app', { replace: true });
    } else {
      setCode('');
    }
  }

  async function onResend() {
    const result = await resend.run();
    if (result) {
      toast.success(`New code sent to ${email}`);
      setCooldown(60);
      verify.setError(null);
    }
  }

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        <>
          {location.state?.notice && <span className="block">{location.state.notice}</span>}
          We sent a 6-digit code to <span className="font-medium text-fg">{email}</span>. It expires in 10 minutes.
        </>
      }
      footer={
        <>
          Wrong email?{' '}
          <Link to="/register" className={linkClass}>
            Start over
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={submit}
          disabled={verify.pending}
          invalid={!!verify.error}
        />
        {verify.error && <p className="text-sm text-danger">{verify.error.message}</p>}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={verify.pending}
          disabled={code.length !== 6}
        >
          Confirm email
        </Button>

        <p className="text-center text-sm text-fg-muted">
          Didn't get it? Check spam, or{' '}
          {cooldown > 0 ? (
            <span className="tabular-nums">resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={onResend} disabled={resend.pending} className={linkClass}>
              {resend.pending ? <Spinner className="inline size-3" /> : 'send a new code'}
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
