import { useState } from 'react';
import { ApiError } from '@/lib/api';

// Pending and error state for an auth form. The action may throw ApiError; anything
// else is treated as the server being unreachable.
export function useSubmit(action) {
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function run(...args) {
    setError(null);
    setPending(true);
    try {
      return await action(...args);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Could not reach the server. Try again in a moment.'));
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error, setError };
}
