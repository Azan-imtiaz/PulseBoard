import { useRef } from 'react';
import { cn } from '@/lib/cn';

const LENGTH = 6;

// Six single-digit boxes. Typing moves forward, Backspace moves back, and pasting
// a whole code fills every box. Calls onComplete once all six digits are in.
export function OtpInput({ value, onChange, onComplete, disabled, invalid }) {
  const boxes = useRef([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');

  function update(next) {
    const clean = next.replace(/\D/g, '').slice(0, LENGTH);
    onChange(clean);
    boxes.current[Math.min(clean.length, LENGTH - 1)]?.focus();
    if (clean.length === LENGTH) onComplete?.(clean);
  }

  function onKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      update(value.slice(0, index - 1));
    } else if (event.key === 'ArrowLeft' && index > 0) {
      boxes.current[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < LENGTH - 1) {
      boxes.current[index + 1].focus();
    }
  }

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={(e) => (e.preventDefault(), update(e.clipboardData.getData('text')))}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (boxes.current[index] = el)}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
          autoFocus={index === 0}
          maxLength={LENGTH}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => onKeyDown(index, e)}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, '');
            if (!typed) return update(value.slice(0, index));
            // A single box receiving several digits is autofill from the OS; treat it like a paste.
            update(typed.length > 1 ? typed : value.slice(0, index) + typed);
          }}
          className={cn(
            'h-12 w-full rounded-lg border bg-surface text-center font-mono text-xl font-medium text-fg outline-none transition-colors',
            'focus:border-accent focus:ring-3 focus:ring-accent-soft disabled:opacity-60',
            invalid ? 'border-danger/60' : 'border-line hover:border-line-strong',
          )}
        />
      ))}
    </div>
  );
}
