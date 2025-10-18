'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usersApi } from '@/lib/api/users';
import { socialApi } from '@/lib/api/social';
import { UserWithSocial } from '@/types';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserWithSocial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    try {
      setIsLoading(true);
      setHasSearched(true);
      const response = await usersApi.searchUsers(query);
      setResults(response.data.items);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await socialApi.followUser(userId);
      setFollowingIds((prev) => new Set(prev).add(userId));
    } catch (error) {
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await socialApi.unfollowUser(userId);
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
    }
  };

  // Show authentication message if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to search for users.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Users</h1>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                <Search className="w-5 h-5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : hasSearched ? (
          results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg">No users found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try searching with a different query
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {results.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex items-center space-x-3 flex-1"
                      >
                        <Avatar
                          src={user.avatarUrl}
                          name={user.displayName || user.username}
                          size="md"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </Link>

                      <Button
                        size="sm"
                        variant={
                          followingIds.has(user.id) || user.is_following
                            ? 'secondary'
                            : 'primary'
                        }
                        onClick={() =>
                          followingIds.has(user.id) || user.is_following
                            ? handleUnfollow(user.id)
                            : handleFollow(user.id)
                        }
                      >
                        {followingIds.has(user.id) || user.is_following
                          ? 'Following'
                          : 'Follow'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Start searching for users</p>
              <p className="text-gray-400 text-sm mt-2">
                Enter a name or username to find people
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

