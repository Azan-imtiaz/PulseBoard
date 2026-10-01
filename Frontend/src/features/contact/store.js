import { useSyncExternalStore } from 'react';

// A single dialog, opened from several unrelated places (sidebar menu, command
// palette, the guide), so a tiny external store avoids threading state and a
// callback through every layout in between.
let open = false;
const listeners = new Set();

export function openContactDialog() {
  open = true;
  listeners.forEach((l) => l());
}

export function closeContactDialog() {
  open = false;
  listeners.forEach((l) => l());
}

export function useContactDialogOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
}
