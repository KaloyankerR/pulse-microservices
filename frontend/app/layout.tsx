import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { ConfigInjector } from '@/components/ConfigInjector';

export const metadata: Metadata = {
  title: 'Pulse - Social Network',
  description: 'Connect with friends and share your moments',
};

// Force dynamic rendering to ensure env vars are read at request time, not build time
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Config will be injected by ConfigInjector component via /api/config route */}
        {/* This ensures we always get runtime env vars, not build-time values */}
      </head>
      <body>
        <ConfigInjector />
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
