import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Field, Input } from '@/components/Input';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/Menu';
import { useCreateWorkspace, useWorkspaces } from './api';

function WorkspaceMark({ name }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-fg text-2xs font-semibold text-canvas">
      {name[0]?.toUpperCase()}
    </span>
  );
}

export function WorkspaceSwitcher({ current }) {
  const { data: workspaces = [] } = useWorkspaces();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Menu>
        <MenuTrigger className="flex h-8 w-full items-center gap-2 rounded-md px-1.5 text-left outline-none hover:bg-hover data-[state=open]:bg-hover">
          {current ? <WorkspaceMark name={current.name} /> : <span className="skeleton size-5" />}
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{current?.name}</span>
          <ChevronsUpDown className="size-3.5 text-fg-faint" />
        </MenuTrigger>
        <MenuContent className="w-56">
          <MenuLabel>Workspaces</MenuLabel>
          {workspaces.map((w) => (
            <MenuItem
              key={w.id}
              icon={<WorkspaceMark name={w.name} />}
              hint={w.role}
              checked={w.id === current?.id}
              onSelect={() => navigate(`/w/${w.id}`)}
            >
              {w.name}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem icon={<Plus className="size-3.5" />} onSelect={() => setCreating(true)}>
            New workspace
          </MenuItem>
        </MenuContent>
      </Menu>
      <NewWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function NewWorkspaceDialog({ open, onOpenChange }) {
  const [name, setName] = useState('');
  const create = useCreateWorkspace();
  const navigate = useNavigate();

  function onSubmit(event) {
    event.preventDefault();
    create.mutate(name, {
      onSuccess: (workspace) => {
        onOpenChange(false);
        setName('');
        navigate(`/w/${workspace.id}`);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New workspace"
      description="You'll be its owner. Invite people from the Members page."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Name">
          <Input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Engineering"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={create.isPending}>
            Create workspace
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
