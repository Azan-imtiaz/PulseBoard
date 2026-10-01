import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import { Button, IconButton } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Tooltip } from '@/components/Tooltip';
import { aiErrorMessage } from './errors';

const RANGES = [7, 14, 28];

export function SprintReportDialog({ board, open, onClose }) {
  const [days, setDays] = useState(14);
  const report = useQuery({
    queryKey: ['sprint-report', board.id, days],
    queryFn: () => api(`/ai/boards/${board.id}/sprint-report`, { method: 'POST', body: { days } }),
    enabled: open,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Sprint report"
      description={`${board.name} · numbers come from board activity, the write-up from AI.`}
      className="top-[8vh] max-w-2xl"
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-line p-0.5">
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDays(range)}
              className={cn(
                'h-6 rounded-sm px-2.5 text-xs transition-colors',
                days === range ? 'bg-hover font-medium text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              Last {range} days
            </button>
          ))}
        </div>
        {report.data && (
          <span className="flex items-center gap-1 text-xs text-fg-faint">
            Generated {timeAgo(report.data.generatedAt)}
            <Tooltip content="Regenerate">
              <IconButton
                label="Regenerate"
                className="size-6"
                onClick={() => report.refetch()}
                disabled={report.isFetching}
              >
                <RefreshCw className={cn('size-3', report.isFetching && 'animate-spin')} />
              </IconButton>
            </Tooltip>
          </span>
        )}
      </div>

      {report.isPending && <ReportSkeleton />}

      {report.isError && (
        <div className="mt-6 rounded-lg border border-line px-4 py-5 text-sm">
          <p className="text-fg-muted">{aiErrorMessage(report.error)}</p>
          <Button className="mt-3" size="sm" onClick={() => report.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {report.data && (
        <div className={cn('transition-opacity', report.isFetching && 'opacity-50')}>
          <dl className="mt-5 grid grid-cols-4 divide-x divide-line rounded-lg border border-line">
            <Stat label="Shipped" value={report.data.stats.shipped} />
            <Stat label="In flight" value={report.data.stats.inProgress} />
            <Stat
              label="Blocked"
              value={report.data.stats.blocked}
              tone={report.data.stats.blocked > 0 ? 'danger' : undefined}
            />
            <Stat label="Created" value={report.data.stats.created} />
          </dl>

          <Velocity weeks={report.data.velocity} />

          <div className="prose-report scroll-thin mt-5 max-h-[38vh] overflow-y-auto border-t border-line pt-4">
            <Markdown>{report.data.narrative}</Markdown>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd
        className={cn('mt-0.5 text-2xl font-semibold tracking-tight tabular-nums', tone === 'danger' && 'text-danger')}
      >
        {value}
      </dd>
    </div>
  );
}

function Velocity({ weeks }) {
  const max = Math.max(1, ...weeks.map((w) => w.completed));

  return (
    <figure className="mt-5">
      <figcaption className="text-xs text-fg-muted">Tasks completed per week</figcaption>
      <div className="mt-3 flex h-24 items-end gap-2">
        {weeks.map((week, i) => {
          const current = i === weeks.length - 1;
          return (
            <div key={week.weekStart} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-2xs text-fg-muted tabular-nums">{week.completed}</span>
              <div
                className={cn('w-full rounded-sm', current ? 'bg-accent' : 'bg-line-strong')}
                style={{ height: `${Math.max(3, (week.completed / max) * 64)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {weeks.map((week) => (
          <span key={week.weekStart} className="flex-1 text-center text-2xs text-fg-faint">
            {format(new Date(week.weekStart), 'MMM d')}
          </span>
        ))}
      </div>
    </figure>
  );
}

function ReportSkeleton() {
  return (
    <div className="mt-5" aria-busy>
      <div className="skeleton h-[68px] rounded-lg" />
      <div className="mt-5 flex h-24 items-end gap-2">
        {[40, 55, 30, 70, 50, 62].map((h, i) => (
          <div key={i} className="skeleton flex-1" style={{ height: h }} />
        ))}
      </div>
      <p className="mt-5 text-sm text-fg-muted">Reading the last few weeks of board activity…</p>
      <div className="mt-3 space-y-2">
        <div className="skeleton h-3.5 w-11/12" />
        <div className="skeleton h-3.5 w-4/5" />
        <div className="skeleton h-3.5 w-3/5" />
      </div>
    </div>
  );
}
