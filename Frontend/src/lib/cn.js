import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// twMerge lets a caller's className override a component's defaults (e.g. top-*).
export const cn = (...classes) => twMerge(clsx(classes));
