import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState } from '@/components/States';
import { useBoards, useWorkspace, useWorkspaces } from './api';
import { isAdmin } from './permissions';
import { NewBoardDialog } from './NewBoardDialog';

// "/" sends you to your first workspace.
export function RootRedirect() {
  const workspaces = useWorkspaces();
  if (workspaces.isError)
    return <ErrorState className="min-h-svh" error={workspaces.error} onRetry={() => workspaces.refetch()} />;
  if (!workspaces.data) return null;
  const first = workspaces.data[0];
  return first ? <Navigate to={`/w/${first.id}`} replace /> : <NoWorkspaces />;
}

function NoWorkspaces() {
  return (
    <EmptyState
      className="min-h-svh"
      title="You're not in any workspaces"
      body="Ask a teammate to add you by email, or create a workspace of your own from the menu."
    />
  );
}

// A workspace's landing page is its first board.
export function WorkspaceHome() {
  const { workspaceId = '' } = useParams();
  const boards = useBoards(workspaceId);
  const { data: workspace } = useWorkspace(workspaceId);
  const [creating, setCreating] = useState(false);

  if (boards.isError) return <ErrorState className="flex-1" error={boards.error} onRetry={() => boards.refetch()} />;
  if (!boards.data) return null;
  if (boards.data[0]) return <Navigate to={`/w/${workspaceId}/b/${boards.data[0].id}`} replace />;

  const admin = isAdmin(workspace?.role);
  return (
    <>
      <EmptyState
        className="flex-1"
        title="No boards yet"
        body={
          admin
            ? 'A board holds the tasks for one team or project. Create one to get started.'
            : 'An admin needs to create the first board in this workspace.'
        }
        action={
          admin && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              Create a board
            </Button>
          )
        }
      />
      <NewBoardDialog workspaceId={workspaceId} open={creating} onOpenChange={setCreating} />
    </>
  );
}
