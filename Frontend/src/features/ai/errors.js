import { ApiError } from '@/lib/api';

export function aiErrorMessage(error) {
  if (error instanceof ApiError && error.code === 'ai_disabled') {
    return 'AI features are turned off on this server. Set NVIDIA_API_KEY in the backend .env to enable them.';
  }
  if (error instanceof ApiError && error.code === 'rate_limited') {
    return 'That’s a lot of AI requests in a short time. Give it a minute and try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
