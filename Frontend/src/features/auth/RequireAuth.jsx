import { Navigate, Outlet, useLocation } from 'react-router';
import { Logo } from '@/components/Logo';
import { useAuth } from './AuthProvider';

export function RequireAuth() {
  const { status, signedOutOnPurpose } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Logo className="animate-[live-pulse_1.6s_ease-in-out_infinite]" markOnly />
      </div>
    );
  }
  if (status === 'signed-out') {
    if (signedOutOnPurpose) return <Navigate to="/" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
