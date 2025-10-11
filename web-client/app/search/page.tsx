'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { usersApi } from '@/lib/api/users';
import { socialApi } from '@/lib/api/social';
import { UserWithSocial } from '@/types';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function SearchPage() {
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
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await socialApi.followUser(userId);
      setFollowingIds((prev) => new Set(prev).add(userId));
    } catch (error) {
      console.error('Failed to follow user:', error);
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
      console.error('Failed to unfollow user:', error);
    }
  };

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
                          src={user.avatar_url}
                          name={user.display_name || user.username}
                          size="md"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.display_name || user.username}
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

