export class ApiError extends Error {
  // `details` is the full error body, for extras like `suggestions` or `retryAfter`.
  constructor(status, message, code, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken = null;
let onSessionLost = null;
let refreshing = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => void (accessToken = token);
export const handleSessionLost = (callback) => void (onSessionLost = callback);

async function parseError(res) {
  const body = await res.json().catch(() => null);
  return new ApiError(res.status, body?.error?.message ?? res.statusText, body?.error?.code, body?.error);
}

async function requestRefresh() {
  const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'same-origin' });
  if (res.ok) return res.json();

  // Another tab rotated the cookie a moment ago. The browser now has the new one,
  // so a single retry picks it up.
  if (res.status === 409) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const retry = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'same-origin' });
    if (retry.ok) return retry.json();
  }
  return null;
}

// Every caller that hits a 401 at the same moment shares one refresh request.
export function refreshSession() {
  refreshing ??= requestRefresh()
    .then((session) => {
      setAccessToken(session?.accessToken ?? null);
      return session;
    })
    .finally(() => (refreshing = null));
  return refreshing;
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const send = () =>
    fetch(`/api/v1${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await send();

  if (res.status === 401 && accessToken) {
    const session = await refreshSession();
    if (!session) {
      onSessionLost?.();
      throw new ApiError(401, 'Your session has expired. Please sign in again.', 'session_expired');
    }
    res = await send();
  }

  if (!res.ok) throw await parseError(res);
  return res.status === 204 ? undefined : res.json();
}
