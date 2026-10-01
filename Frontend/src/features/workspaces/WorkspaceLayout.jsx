import { useState } from 'react';
import { Link, Outlet, useParams } from 'react-router';
import { useHotkey } from '@/lib/hotkeys';
import { EmptyState } from '@/components/States';
import { CommandPalette } from '@/features/command/CommandPalette';
import { Sidebar } from './Sidebar';
import { useWorkspace } from './api';
import { closeMobileSidebar, useMobileSidebarOpen } from './sidebarStore';

export function WorkspaceLayout() {
  const { workspaceId = '' } = useParams();
  const workspace = useWorkspace(workspaceId);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const mobileSidebarOpen = useMobileSidebarOpen();

  useHotkey('mod+k', () => setPaletteOpen((open) => !open));

  if (workspace.isSuccess && !workspace.data) {
    return (
      <EmptyState
        className="min-h-svh"
        title="Workspace not found"
        body="It may have been deleted, or you're no longer a member."
        action={
          <Link to="/app" className="text-sm font-medium underline-offset-4 hover:underline">
            Go to your workspaces
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar
        workspaceId={workspaceId}
        onOpenPalette={() => setPaletteOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <main className="relative flex min-w-0 flex-1 flex-col bg-surface">
        <Outlet />
      </main>
      <CommandPalette workspaceId={workspaceId} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
