import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/Input';
import { passwordProblem, passwordScore } from './passwordRules';

export function PasswordField({ value, onChange, autoComplete = 'current-password', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-fg-faint hover:text-fg-muted"
      >
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

const LEVELS = [
  { label: 'Too weak', tone: 'bg-danger' },
  { label: 'Weak', tone: 'bg-danger' },
  { label: 'Okay', tone: 'bg-warn' },
  { label: 'Good', tone: 'bg-ok' },
  { label: 'Strong', tone: 'bg-ok' },
];

export function PasswordStrength({ password, email, username }) {
  if (!password) return null;
  const problem = passwordProblem(password, { email, username });
  const score = problem ? Math.min(passwordScore(password), 1) : Math.max(passwordScore(password), 2);
  const level = LEVELS[score];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors', i <= score ? level.tone : 'bg-line')}
          />
        ))}
      </div>
      <p className={cn('mt-1.5 text-xs', problem ? 'text-danger' : 'text-fg-muted')}>
        {problem ?? `${level.label} password${score < 4 ? '. Longer is stronger.' : ''}`}
      </p>
    </div>
  );
}
