'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
            {mounted && (
              <ToastViewport>
                <Toast
                  variant="default"
                  className="bg-background border-border"
                >
                  <ToastTitle>Placeholder</ToastTitle>
                  <ToastDescription>Toast system ready</ToastDescription>
                  <ToastClose />
                </Toast>
              </ToastViewport>
            )}
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}