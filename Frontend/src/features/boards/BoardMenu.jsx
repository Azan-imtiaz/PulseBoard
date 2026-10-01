import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Field, Input, inputClass } from '@/components/Input';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/Menu';
import { useBoardSettings } from './api';

// Admin-only actions for the open board. The server enforces the same rule.
export function BoardMenu({ board }) {
  const [dialog, setDialog] = useState(null);

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <IconButton label="Board actions">
            <MoreHorizontal className="size-4" />
          </IconButton>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem icon={<Pencil className="size-3.5" />} onSelect={() => setDialog('edit')}>
            Edit board
          </MenuItem>
          <MenuSeparator />
          <MenuItem destructive icon={<Trash2 className="size-3.5 text-danger" />} onSelect={() => setDialog('delete')}>
            Delete board
          </MenuItem>
        </MenuContent>
      </Menu>

      <EditBoardDialog
        board={board}
        open={dialog === 'edit'}
        onOpenChange={(open) => setDialog(open ? 'edit' : null)}
      />
      <DeleteBoardDialog
        board={board}
        open={dialog === 'delete'}
        onOpenChange={(open) => setDialog(open ? 'delete' : null)}
      />
    </>
  );
}

function EditBoardDialog({ board, open, onOpenChange }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit board"
      description={`The key ${board.key} can't change.`}
    >
      {/* Remounted on every open so the form starts from the current values. */}
      {open && <EditBoardForm board={board} onDone={() => onOpenChange(false)} />}
    </Dialog>
  );
}

function EditBoardForm({ board, onDone }) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description);
  const { update } = useBoardSettings(board.id, board.workspaceId);

  function onSubmit(event) {
    event.preventDefault();
    update.mutate(
      { name, description },
      {
        onSuccess: () => {
          toast.success('Board updated');
          onDone();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name">
        <Input autoFocus required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Description" hint={`${description.length}/500`}>
        <textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this board is for"
          className={cn(inputClass, 'h-auto resize-none py-2 leading-6')}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={update.isPending} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </form>
  );
}

function DeleteBoardDialog({ board, open, onOpenChange }) {
  const { remove } = useBoardSettings(board.id, board.workspaceId);
  const navigate = useNavigate();

  function onDelete() {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Deleted ${board.name}`);
        navigate(`/w/${board.workspaceId}`, { replace: true });
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${board.name}?`}
      description="Every task, comment and attachment on this board will be gone for everyone. This can't be undone."
    >
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="danger" loading={remove.isPending} onClick={onDelete}>
          Delete board
        </Button>
      </div>
    </Dialog>
  );
}
