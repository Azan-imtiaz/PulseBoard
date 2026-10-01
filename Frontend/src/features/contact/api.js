import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSendContact() {
  return useMutation({
    mutationFn: (input) => api('/contact', { method: 'POST', body: input }),
  });
}
