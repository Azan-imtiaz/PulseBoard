import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ChevronsUpDown,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  FileCode2,
  House,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { modKey } from '@/lib/format';
import { setTheme, useTheme } from '@/lib/theme';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { Kbd } from '@/components/Kbd';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/Menu';
import { Tooltip } from '@/components/Tooltip';
import { useAuth, useCurrentUser } from '@/features/auth/AuthProvider';
import { openContactDialog } from '@/features/contact/store';
import { useBoards, useWorkspace } from './api';
import { isAdmin } from './permissions';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { NewBoardDialog } from './NewBoardDialog';

const navItem =
  'flex h-7 items-center gap-2 rounded-md px-2 text-sm text-fg-muted transition-colors hover:bg-hover hover:text-fg';
const navActive = 'bg-hover text-fg font-medium';

export function Sidebar({ workspaceId, onOpenPalette, mobileOpen = false, onMobileClose }) {
  const { data: workspace } = useWorkspace(workspaceId);
  const boards = useBoards(workspaceId);
  const [creatingBoard, setCreatingBoard] = useState(false);

  const close = () => onMobileClose?.();
  const openPalette = () => {
    close();
    onOpenPalette();
  };

  return (
    <>
      {/* Backdrop: mobile/tablet only, dismisses the drawer on tap. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-overlay lg:hidden"
            onClick={close}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-line bg-canvas transition-transform duration-200 ease-out',
          'lg:static lg:z-auto lg:w-60 lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-lift' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="min-w-0 flex-1">
            <WorkspaceSwitcher current={workspace} />
          </div>
          <IconButton label="Close menu" className="shrink-0 lg:hidden" onClick={close}>
            <X className="size-4" />
          </IconButton>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={openPalette}
            className="flex h-8 w-full items-center gap-2 rounded-md border border-line bg-surface px-2 text-sm text-fg-faint transition-colors hover:border-line-strong hover:text-fg-muted"
          >
            <Search className="size-3.5" />
            <span className="flex-1 truncate text-left">Search…</span>
            <span className="hidden gap-0.5 sm:flex">
              <Kbd>{modKey}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </div>

        <nav className="scroll-thin flex-1 overflow-y-auto px-3 pt-5">
          <div className="mb-1 flex h-6 items-center justify-between pl-2">
            <span className="text-2xs font-medium text-fg-faint">Boards</span>
            {isAdmin(workspace?.role) && (
              <Tooltip content="New board">
                <IconButton label="New board" className="size-6" onClick={() => setCreatingBoard(true)}>
                  <Plus className="size-3.5" />
                </IconButton>
              </Tooltip>
            )}
          </div>

          {boards.isPending && (
            <div className="space-y-1.5 px-2 pt-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-5" style={{ width: `${70 - i * 12}%` }} />
              ))}
            </div>
          )}

          {boards.data?.length === 0 && <p className="px-2 py-1 text-xs text-fg-faint">No boards yet</p>}

          <ul className="space-y-px">
            {boards.data?.map((board) => (
              <li key={board.id}>
                <NavLink
                  to={`/w/${workspaceId}/b/${board.id}`}
                  onClick={close}
                  className={({ isActive }) => cn(navItem, isActive && navActive)}
                >
                  <span className="w-9 font-mono text-2xs text-fg-faint">{board.key}</span>
                  <span className="truncate">{board.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-5 mb-1 pl-2 text-2xs font-medium text-fg-faint">Workspace</div>
          <NavLink
            to={`/w/${workspaceId}/members`}
            onClick={close}
            className={({ isActive }) => cn(navItem, isActive && navActive)}
          >
            <Users className="size-3.5" />
            Members
            {workspace && <span className="ml-auto text-xs text-fg-faint">{workspace.memberCount}</span>}
          </NavLink>
          {isAdmin(workspace?.role) && (
            <NavLink
              to={`/w/${workspaceId}/settings`}
              onClick={close}
              className={({ isActive }) => cn(navItem, isActive && navActive)}
            >
              <Settings className="size-3.5" />
              Settings
            </NavLink>
          )}
          <NavLink to="/guide" onClick={close} className={({ isActive }) => cn(navItem, isActive && navActive)}>
            <BookOpen className="size-3.5" />
            Guide
          </NavLink>
        </nav>

        <div className="border-t border-line p-3">
          <UserMenu />
        </div>

        <NewBoardDialog workspaceId={workspaceId} open={creatingBoard} onOpenChange={setCreatingBoard} />
      </aside>
    </>
  );
}

function UserMenu() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Menu>
      <MenuTrigger className="flex h-8 w-full items-center gap-2 rounded-md px-1.5 text-left outline-none hover:bg-hover data-[state=open]:bg-hover">
        <Avatar person={user} size={22} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>
        <ChevronsUpDown className="size-3.5 text-fg-faint" />
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuLabel>
          @{user.username} · {user.email}
        </MenuLabel>
        <MenuSeparator />
        <MenuLabel>Theme</MenuLabel>
        <MenuItem icon={<Sun className="size-3.5" />} checked={theme === 'light'} onSelect={() => setTheme('light')}>
          Light
        </MenuItem>
        <MenuItem icon={<Moon className="size-3.5" />} checked={theme === 'dark'} onSelect={() => setTheme('dark')}>
          Dark
        </MenuItem>
        <MenuItem
          icon={<Monitor className="size-3.5" />}
          checked={theme === 'system'}
          onSelect={() => setTheme('system')}
        >
          System
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<House className="size-3.5" />} onSelect={() => navigate('/')}>
          Home page
        </MenuItem>
        <MenuItem icon={<FileCode2 className="size-3.5" />} onSelect={() => window.open('/docs', '_blank')}>
          API reference
        </MenuItem>
        <MenuItem icon={<Mail className="size-3.5" />} onSelect={openContactDialog}>
          Contact the team
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<LogOut className="size-3.5" />} onSelect={logout}>
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
