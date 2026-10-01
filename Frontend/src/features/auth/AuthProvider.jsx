import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, handleSessionLost, refreshSession, setAccessToken } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null });

  const startSession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setState({ status: 'signed-in', user: session.user });
  }, []);

  // `signedOutOnPurpose` lets the app send people who clicked "Sign out" to the home
  // page, and people whose session ran out to the sign-in page.
  const endSession = useCallback(
    (signedOutOnPurpose = false) => {
      setAccessToken(null);
      disconnectSocket();
      queryClient.clear();
      setState({ status: 'signed-out', user: null, signedOutOnPurpose });
    },
    [queryClient],
  );

  // Restore the session from the refresh cookie on first load.
  useEffect(() => {
    refreshSession().then((session) => (session ? startSession(session) : endSession()));
  }, [startSession, endSession]);

  useEffect(() => {
    handleSessionLost(() => {
      endSession();
      toast.error('Your session expired. Please sign in again.');
    });
  }, [endSession]);

  const value = useMemo(
    () => ({
      ...state,
      // `identifier` is an email or a username.
      login: async (identifier, password) =>
        startSession(await api('/auth/login', { method: 'POST', body: { identifier, password } })),
      // Sign-up doesn't start a session: the email has to be confirmed with a code first.
      register: (input) => api('/auth/register', { method: 'POST', body: input }),
      verifyEmail: async (email, code) =>
        startSession(await api('/auth/verify-email', { method: 'POST', body: { email, code } })),
      resetPassword: async (email, code, password) =>
        startSession(await api('/auth/reset-password', { method: 'POST', body: { email, code, password } })),
      logout: async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
        endSession(true);
      },
    }),
    [state, startSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export function useCurrentUser() {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called while signed out');
  return user;
}
