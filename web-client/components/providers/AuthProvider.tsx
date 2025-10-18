'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Spinner } from '@/components/ui/Spinner';

const publicRoutes = ['/auth/login', '/auth/register', '/auth/callback', '/', '/feed'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Run auth check once on mount
  useEffect(() => {
    const runCheck = async () => {
      await checkAuth();
      setInitialCheckDone(true);
    };
    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle routing after auth check is complete
  useEffect(() => {
    if (!initialCheckDone || isLoading) {
      return; // Don't redirect while checking auth
    }

    // Check if current route is public
    // Special handling for root route - only match exactly "/"
    const isPublicRoute = publicRoutes.some((route) => {
      if (route === '/') {
        return pathname === '/';
      }
      return pathname?.startsWith(route);
    });


    // Redirect root path to feed for all users
    if (pathname === '/') {
      router.replace('/feed');
    } else if (!isAuthenticated && !isPublicRoute) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, pathname, router, initialCheckDone]);

  // Show loading spinner during initial auth check
  if (!initialCheckDone || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if current route requires authentication
  // Special handling for root route - only match exactly "/"
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(route);
  });

  // Don't render protected content if user is not authenticated
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

