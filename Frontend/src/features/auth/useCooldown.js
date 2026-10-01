import { useEffect, useState } from 'react';

// Seconds left before "Resend code" is allowed again.
export function useCooldown(initial = 0) {
  const [left, setLeft] = useState(initial);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return [left, setLeft];
}
