import { createBrowserRouter, Link, RouterProvider } from 'react-router';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { WorkspaceLayout } from '@/features/workspaces/WorkspaceLayout';
import { RootRedirect, WorkspaceHome } from '@/features/workspaces/WorkspaceHome';
import { MembersPage } from '@/features/workspaces/MembersPage';
import { SettingsPage } from '@/features/workspaces/SettingsPage';
import { GuidePage } from '@/features/guide/GuidePage';
import { BoardPage } from '@/features/boards/BoardPage';
import { EmptyState } from '@/components/States';
import { HomePage } from '@/features/home/HomePage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  // Reachable whether signed in or signed out, not nested under RequireAuth or
  // a workspace, so it doesn't depend on either.
  { path: '/guide', element: <GuidePage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/app', element: <RootRedirect /> },
      {
        path: '/w/:workspaceId',
        element: <WorkspaceLayout />,
        children: [
          { index: true, element: <WorkspaceHome /> },
          { path: 'b/:boardId', element: <BoardPage /> },
          { path: 'members', element: <MembersPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <EmptyState
        className="min-h-svh"
        title="Page not found"
        body="The link may be broken, or the page may have moved."
        action={
          <Link to="/" className="text-sm font-medium underline-offset-4 hover:underline">
            Back to PulseBoard
          </Link>
        }
      />
    ),
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
