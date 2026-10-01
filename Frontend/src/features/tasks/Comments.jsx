import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { modKey, timeAgo } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useCurrentUser } from '@/features/auth/AuthProvider';
import { ThreadSummary } from '@/features/ai/ThreadSummary';

export function Comments({ task, members }) {
  const comments = useQuery({
    queryKey: ['comments', task.id],
    queryFn: () => api(`/tasks/${task.id}/comments`).then((r) => r.comments),
  });

  return (
    <section className="border-t border-line px-6 pt-5 pb-6">
      <h3 className="text-sm font-medium">Comments</h3>

      <ThreadSummary taskId={task.id} commentCount={comments.data?.length ?? 0} />

      {comments.isPending && (
        <div className="mt-4 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton size-6 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}
      {comments.isError && <p className="mt-4 text-sm text-danger">Couldn't load comments. {comments.error.message}</p>}
      {comments.data?.length === 0 && (
        <p className="mt-4 text-sm text-fg-faint">No comments yet. Start the conversation below.</p>
      )}

      <ol className="mt-4 space-y-5">
        {comments.data?.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar person={comment.author} size={24} className="mt-px" />
            <div className="min-w-0 flex-1">
              <p className="text-xs">
                <span className="font-medium text-fg">{comment.author.name}</span>
                <span className="ml-2 text-fg-faint">{timeAgo(comment.createdAt)}</span>
              </p>
              <p className="mt-0.5 text-sm leading-6 break-words whitespace-pre-wrap text-fg">
                <CommentBody comment={comment} members={members} />
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Composer task={task} members={members} />
    </section>
  );
}

function CommentBody({ comment, members }) {
  const usernames = members.filter((m) => comment.mentions.includes(m.id)).map((m) => m.username);
  if (usernames.length === 0) return <>{comment.body}</>;

  const escaped = usernames.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(@(?:${escaped.join('|')})(?![a-z0-9._]*[a-z0-9]))`, 'gi');
  return (
    <>
      {comment.body.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="rounded-sm bg-accent-soft px-0.5 font-medium text-accent">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Composer({ task, members }) {
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const textarea = useRef(null);
  const caretAfterRender = useRef(null);
  const [body, setBody] = useState('');
  const [query, setQuery] = useState(null);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return members
      .filter((m) => m.id !== me.id && (m.username.includes(q) || m.name.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [query, members, me.id]);

  const send = useMutation({
    // The server works out who's mentioned from the @usernames in the text.
    mutationFn: () => api(`/tasks/${task.id}/comments`, { method: 'POST', body: { body } }),
    onSuccess: ({ comment }) => {
      setBody('');
      queryClient.setQueryData(['comments', task.id], (all = []) =>
        all.some((c) => c.id === comment.id) ? all : [...all, comment],
      );
    },
    onError: (err) => toast.error(err.message),
  });

  function detectMention(value, caret) {
    const match = /(?:^|\s)@([a-z0-9._]*)$/i.exec(value.slice(0, caret));
    setQuery(match ? match[1] : null);
    setHighlight(0);
  }

  function insertMention(member) {
    const el = textarea.current;
    const caret = el.selectionStart;
    const before = body.slice(0, caret).replace(/@([a-z0-9._]*)$/i, `@${member.username} `);
    const next = before + body.slice(caret);
    setBody(next);
    setQuery(null);
    caretAfterRender.current = before.length;
  }

  // Put the caret right after the inserted mention before the next keystroke lands.
  useLayoutEffect(() => {
    if (caretAfterRender.current === null) return;
    textarea.current.focus();
    textarea.current.setSelectionRange(caretAfterRender.current, caretAfterRender.current);
    caretAfterRender.current = null;
  }, [body]);

  function onKeyDown(e) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setHighlight((h) => (h + step + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[highlight]);
        return;
      }
      if (e.key === 'Escape') {
        e.stopPropagation();
        setQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && body.trim()) send.mutate();
  }

  return (
    <div className="relative mt-6 flex gap-3">
      <Avatar person={me} size={24} className="mt-1" />
      <div className="flex-1 rounded-lg border border-line bg-surface transition-colors focus-within:border-line-strong">
        <textarea
          ref={textarea}
          value={body}
          rows={2}
          placeholder="Leave a comment… Use @ to mention someone."
          onChange={(e) => {
            setBody(e.target.value);
            detectMention(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setQuery(null), 120)}
          className="block max-h-60 min-h-16 w-full resize-none bg-transparent px-3 pt-2.5 text-sm leading-6 outline-none [field-sizing:content]"
        />
        <div className="flex items-center justify-end gap-2 px-2 pb-2">
          <span className="text-2xs text-fg-faint">{modKey}↵ to send</span>
          <Button size="sm" onClick={() => send.mutate()} disabled={!body.trim()} loading={send.isPending}>
            Comment
          </Button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute bottom-full left-9 z-10 mb-1 w-64 rounded-lg bg-surface p-1 shadow-pop" role="listbox">
          {suggestions.map((member, i) => (
            <li
              key={member.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(member);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                'flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm',
                i === highlight && 'bg-hover',
              )}
            >
              <Avatar person={member} size={18} />
              <span className="truncate">{member.name}</span>
              <span className="ml-auto text-xs text-fg-faint">@{member.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
