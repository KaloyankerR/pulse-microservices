'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';

export default function DebugPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('accessToken'));
      setRefreshToken(localStorage.getItem('refreshToken'));
    }
  }, []);

  const testAuthEndpoint = async () => {
    setTestLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await authApi.getCurrentUser();
      setApiResponse(response);
    } catch (error: any) {
      setApiError(error.message || 'Unknown error');
      setApiResponse(error.response?.data || error);
    } finally {
      setTestLoading(false);
    }
  };

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      window.location.reload();
    }
  };

  const handleLogoutAndRedirect = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Authentication Debug Panel
        </h1>

        {/* Auth Store State */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Auth Store State
          </h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-40">Is Authenticated:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  isAuthenticated
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-40">Is Loading:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  isLoading
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-medium w-40">User Object:</span>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto flex-1">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Tokens */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Stored Tokens
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium block mb-1">Access Token:</span>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all">
                {token || <span className="text-red-500">Not found</span>}
              </div>
            </div>
            <div>
              <span className="font-medium block mb-1">Refresh Token:</span>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all">
                {refreshToken || <span className="text-red-500">Not found</span>}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={clearStorage}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Tokens & Reload
              </button>
              <button
                onClick={handleLogoutAndRedirect}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Logout & Go to Login
              </button>
            </div>
          </div>
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test API Endpoint
          </h2>
          <div className="space-y-4">
            <button
              onClick={testAuthEndpoint}
              disabled={testLoading || !token}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {testLoading ? 'Testing...' : 'Test GET /api/v1/users/profile'}
            </button>

            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
                <p className="text-red-700">{apiError}</p>
              </div>
            )}

            {apiResponse && (
              <div>
                <h3 className="font-semibold mb-2">Response:</h3>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Console Logs Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 text-blue-900">
            📋 Checking Console Logs
          </h2>
          <p className="text-blue-800 mb-2">
            Open your browser's Developer Console (F12) to see detailed logs about:
          </p>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Auth check process</li>
            <li>API response structure</li>
            <li>User data validation</li>
            <li>Error details</li>
          </ul>
        </div>

        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Environment
          </h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium w-40">API URL:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </code>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-40">Window Location:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

