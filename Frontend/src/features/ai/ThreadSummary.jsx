import { useMutation } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { IconButton } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { aiErrorMessage } from './errors';

export function ThreadSummary({ taskId, commentCount }) {
  const summarize = useMutation({
    mutationFn: () => api(`/ai/tasks/${taskId}/summary`, { method: 'POST' }),
  });

  const showCard = summarize.isPending || summarize.isSuccess || summarize.isError;

  return (
    <>
      {!showCard && commentCount >= 3 && (
        <button
          type="button"
          onClick={() => summarize.mutate()}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <Sparkles className="size-3.5 text-accent" />
          Summarize {commentCount} comments
        </button>
      )}

      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="mt-3 rounded-lg bg-subtle px-4 py-3"
          >
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <Sparkles className="size-3.5 text-accent" />
              <span className="font-medium text-fg">Summary</span>
              {summarize.data && (
                <span>
                  · {summarize.data.commentCount} comments · {timeAgo(summarize.data.generatedAt)}
                </span>
              )}
              <IconButton label="Dismiss summary" className="ml-auto size-6" onClick={() => summarize.reset()}>
                <X className="size-3.5" />
              </IconButton>
            </div>

            {summarize.isPending && (
              <p className="mt-2 flex items-center gap-2 text-sm text-fg-muted">
                <Spinner className="size-3.5" /> Reading the thread…
              </p>
            )}
            {summarize.isError && <p className="mt-2 text-sm text-fg-muted">{aiErrorMessage(summarize.error)}</p>}
            {summarize.data && (
              <div className="prose-report mt-1">
                <Markdown>{summarize.data.summary}</Markdown>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
