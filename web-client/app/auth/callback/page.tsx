'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters (if backend sends them)
        const accessToken = searchParams.get('access_token') || searchParams.get('accessToken');
        const refreshToken = searchParams.get('refresh_token') || searchParams.get('refreshToken');
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          throw new Error(decodeURIComponent(errorParam));
        }

        if (accessToken && refreshToken) {
          // Tokens provided directly in URL
          apiClient.setAuthTokens(accessToken, refreshToken);
          await checkAuth();
          router.push('/feed');
          return;
        }

        if (code) {
          // Exchange authorization code for tokens
          const response = await apiClient.post<{
            success: boolean;
            data: {
              accessToken: string;
              refreshToken: string;
              user: any;
            };
          }>('/api/v1/auth/oauth/callback', { code });

          if (response.success && response.data) {
            apiClient.setAuthTokens(
              response.data.accessToken,
              response.data.refreshToken
            );
            await checkAuth();
            router.push('/feed');
            return;
          }
        }

        // If we get here, try to get user profile (maybe session-based auth)
        try {
          await checkAuth();
          const token = localStorage.getItem('accessToken');
          if (token) {
            router.push('/feed');
          } else {
            throw new Error('No tokens available after OAuth callback');
          }
        } catch (err) {
          throw new Error('Failed to establish authenticated session');
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, checkAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Spinner size="md" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Completing Authentication
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your login...
        </p>
      </div>
    </div>
  );
}

