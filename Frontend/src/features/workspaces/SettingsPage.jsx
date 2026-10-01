import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Field, Input } from '@/components/Input';
import { PageHeader } from '@/components/PageHeader';
import { useWorkspace, useWorkspaceSettings } from './api';
import { isAdmin } from './permissions';

export function SettingsPage() {
  const { workspaceId = '' } = useParams();
  const { data: workspace, isPending } = useWorkspace(workspaceId);

  if (isPending || !workspace) return <PageHeader crumbs={[workspace?.name, 'Settings']} />;
  if (!isAdmin(workspace.role)) return <Navigate to={`/w/${workspaceId}`} replace />;

  return (
    <>
      <PageHeader crumbs={[workspace.name, 'Settings']} />
      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          {/* Keyed so the field resets if the name changes elsewhere. */}
          <RenameForm key={workspace.name} workspace={workspace} />
          {workspace.role === 'owner' && <DangerZone workspace={workspace} />}
        </div>
      </div>
    </>
  );
}

function RenameForm({ workspace }) {
  const [name, setName] = useState(workspace.name);
  const { rename } = useWorkspaceSettings(workspace.id);
  const unchanged = name.trim() === workspace.name;

  function onSubmit(event) {
    event.preventDefault();
    rename.mutate(name, {
      onSuccess: () => toast.success('Workspace renamed'),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex items-end gap-2">
      <div className="flex-1">
        <Field label="Workspace name">
          <Input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" variant="primary" loading={rename.isPending} disabled={unchanged || !name.trim()}>
        Save
      </Button>
    </form>
  );
}

function DangerZone({ workspace }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const { remove } = useWorkspaceSettings(workspace.id);
  const navigate = useNavigate();

  function onDelete() {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Deleted ${workspace.name}`);
        navigate('/app', { replace: true });
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <section className="mt-12 rounded-lg border border-danger/30 p-5">
      <h2 className="text-sm font-semibold text-danger">Delete workspace</h2>
      <p className="mt-1 text-sm text-fg-muted">
        Permanently deletes {workspace.name} with every board, task, comment and attachment in it, for all{' '}
        {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}.
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setConfirming(true)}>
        Delete workspace
      </Button>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open);
          if (!open) setTyped('');
        }}
        title={`Delete ${workspace.name}?`}
        description="This can't be undone."
      >
        <div className="space-y-4">
          <Field label={`Type ${workspace.name} to confirm`}>
            <Input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={typed.trim() !== workspace.name}
              onClick={onDelete}
            >
              Delete workspace
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
