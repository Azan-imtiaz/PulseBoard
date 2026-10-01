import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Field, Input } from '@/components/Input';
import { useCreateBoard } from './api';

// "Payments Platform" -> "PP", "Mobile" -> "MOB"
function suggestKey(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const key = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? '').slice(0, 3);
  return key
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 6);
}

export function NewBoardDialog({ workspaceId, open, onOpenChange }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const create = useCreateBoard(workspaceId);
  const navigate = useNavigate();

  const effectiveKey = keyEdited ? key : suggestKey(name);

  function onSubmit(event) {
    event.preventDefault();
    create.mutate(
      { name, key: effectiveKey },
      {
        onSuccess: (board) => {
          onOpenChange(false);
          setName('');
          setKey('');
          setKeyEdited(false);
          navigate(`/w/${workspaceId}/b/${board.id}`);
        },
      },
    );
  }

  const error = create.error instanceof ApiError ? create.error.message : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New board"
      description="Boards hold one team's or project's tasks."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name">
          <Input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Platform" />
        </Field>
        <Field label="Key" hint="Prefix for task ids, like PLAT-12" error={error}>
          <Input
            required
            className="font-mono uppercase"
            value={effectiveKey}
            maxLength={6}
            onChange={(e) => {
              setKeyEdited(true);
              setKey(e.target.value.toUpperCase());
            }}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={create.isPending}>
            Create board
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
