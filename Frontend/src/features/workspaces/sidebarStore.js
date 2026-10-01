import { useSyncExternalStore } from 'react';

// Whether the mobile/tablet sidebar drawer is open. Opened from PageHeader (shared
// by every workspace page) and closed from within the Sidebar itself. A store
// avoids threading state through WorkspaceLayout -> Outlet -> each page.
let open = false;
const listeners = new Set();

export function openMobileSidebar() {
  open = true;
  listeners.forEach((l) => l());
}

export function closeMobileSidebar() {
  open = false;
  listeners.forEach((l) => l());
}

export function useMobileSidebarOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
}
