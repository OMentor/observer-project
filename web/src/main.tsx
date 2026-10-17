import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { applyTheme, useThemeStore } from '@/store/theme';
import { useSyncStore } from '@/store/sync';
import { isNetworkError } from '@/lib/errors';
import './index.css';

applyTheme(useThemeStore.getState().theme);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onSuccess: () => useSyncStore.getState().setStatus('idle'),
    onError: (error) => {
      if (isNetworkError(error)) {
        useSyncStore.getState().setStatus('error');
      }
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: () => useSyncStore.getState().setStatus('idle'),
    onError: (error) => {
      if (isNetworkError(error)) {
        useSyncStore.getState().setStatus('error');
      }
    },
  }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
