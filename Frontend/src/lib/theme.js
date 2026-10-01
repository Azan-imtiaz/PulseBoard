import { useSyncExternalStore } from 'react';

const KEY = 'pb-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set();

function read() {
  try {
    return localStorage.getItem(KEY) ?? 'system';
  } catch {
    return 'system';
  }
}

function apply(pref) {
  const dark = pref === 'dark' || (pref === 'system' && media.matches);
  document.documentElement.classList.toggle('dark', dark);
}

media.addEventListener('change', () => apply(read()));

export function setTheme(pref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // Private mode: the choice just won't persist.
  }
  apply(pref);
  listeners.forEach((l) => l());
}

export function useTheme() {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, read);
}
