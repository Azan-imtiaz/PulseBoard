import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/Spinner';
import { inputClass } from '@/components/Input';

// "Maya Chen" -> "maya.chen". Same rules as the server's toUsername.
export function toUsername(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/[._]{2,}/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 20)
    .replace(/[._]+$/, '');
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Checks availability as you type (after a short pause) and offers free
// alternatives when the name is taken. Reports `available` up so the form can
// block submitting a name we already know is gone.
export function UsernameField({ value, onChange, name, onAvailabilityChange }) {
  const debounced = useDebounced(value, 350);
  const settled = debounced === value;

  const check = useQuery({
    queryKey: ['username-available', debounced],
    queryFn: () =>
      api(`/auth/username-available?username=${encodeURIComponent(debounced)}&name=${encodeURIComponent(name)}`),
    enabled: debounced.length > 0,
    staleTime: 15_000,
    retry: false,
  });

  const result = settled && check.data?.username === value ? check.data : null;
  const checking = value.length > 0 && !result && !check.isError;

  useEffect(() => {
    onAvailabilityChange?.(result?.available ?? null);
  }, [result?.available, onAvailabilityChange]);

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-fg-faint">
          @
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s/g, ''))}
          autoComplete="username"
          spellCheck={false}
          required
          maxLength={20}
          className={cn(
            inputClass,
            'pr-8 pl-6',
            result?.available === false && 'border-danger/60 focus:border-danger focus:ring-danger-soft',
          )}
        />
        <span className="absolute inset-y-0 right-2.5 flex items-center">
          {checking && <Spinner className="size-3.5 text-fg-faint" />}
          {result?.available === true && <Check className="size-4 text-ok" aria-label="Available" />}
          {result?.available === false && <X className="size-4 text-danger" aria-label="Not available" />}
        </span>
      </div>

      <div className="mt-1.5 min-h-4 text-xs" aria-live="polite">
        {result?.available === true && <span className="text-ok">@{value} is available</span>}
        {result?.available === false && <span className="text-danger">{result.reason}</span>}
        {check.isError && (
          <span className="text-fg-faint">Couldn't check right now. We'll check when you sign up.</span>
        )}
      </div>

      {result?.suggestions?.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-fg-muted">Try:</span>
          {result.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="h-6 rounded-md border border-line px-2 text-xs text-fg transition-colors hover:border-line-strong hover:bg-subtle"
            >
              @{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
