'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      setIsLoading(true);
      await login(formData.email, formData.password);
      router.push('/feed');
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EFE7] px-4">
      <Card variant="yellow" className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-[#1A1A1A] border-[3px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center justify-center mb-4">
            <span className="text-white font-black text-3xl">P</span>
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A]">Welcome to Pulse</h1>
          <p className="text-[#1A1A1A] font-bold opacity-80">Sign in to continue</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#FF9B85] border-[3px] border-[#1A1A1A] text-[#1A1A1A] px-4 py-3 shadow-[4px_4px_0px_#1A1A1A] font-bold">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              showPasswordToggle={true}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#1A1A1A] font-bold">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-[#1A1A1A] hover:underline font-black"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

