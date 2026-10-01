import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ApiError } from '@/lib/api';
import { TooltipProvider } from '@/components/Tooltip';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ContactDialog } from '@/features/contact/ContactDialog';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retrying a 403/404 just delays showing the real error.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={400}>
          <App />
          <ContactDialog />
        </TooltipProvider>
      </AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'flex w-[340px] items-center gap-2.5 rounded-lg bg-surface px-3.5 py-3 text-sm text-fg shadow-pop',
            error: '[&_[data-icon]]:text-danger',
            success: '[&_[data-icon]]:text-ok',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
