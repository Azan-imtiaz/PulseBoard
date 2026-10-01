import { differenceInCalendarDays, format, formatDistanceToNowStrict } from 'date-fns';

export function dueLabel(date) {
  const days = differenceInCalendarDays(new Date(date), new Date());
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < 0) return `${-days}d overdue`;
  if (days < 7) return format(new Date(date), 'EEE');
  return format(new Date(date), 'MMM d');
}

export function dueTone(date, done) {
  if (done) return 'normal';
  const days = differenceInCalendarDays(new Date(date), new Date());
  if (days < 0) return 'overdue';
  if (days <= 2) return 'soon';
  return 'normal';
}

export function timeAgo(date) {
  if (Date.now() - new Date(date).getTime() < 45_000) return 'just now';
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// cmdk's default matching is fuzzy, which surfaces odd task matches. Plain
// substring matching is more predictable for ids and titles.
export const substringFilter = (value, search) => (value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0);

export const isMac = navigator.platform.toLowerCase().includes('mac');
export const modKey = isMac ? '⌘' : 'Ctrl';
