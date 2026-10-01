import { Fragment } from 'react';
import { Menu } from 'lucide-react';
import { openMobileSidebar } from '@/features/workspaces/sidebarStore';
import { IconButton } from './Button';

export function PageHeader({ crumbs, children }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3 sm:gap-3 sm:px-5">
      <IconButton label="Open menu" className="shrink-0 lg:hidden" onClick={openMobileSidebar}>
        <Menu className="size-4" />
      </IconButton>
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-fg-faint">/</span>}
            <span className={i === crumbs.length - 1 ? 'truncate font-medium text-fg' : 'truncate text-fg-muted'}>
              {crumb ?? '…'}
            </span>
          </Fragment>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">{children}</div>
    </header>
  );
}
