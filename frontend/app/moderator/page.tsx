'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types';
import { Shield, Ban, UserCheck, Search, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

export default function ModeratorPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  // Redirect if not moderator
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (currentUser?.role !== 'MODERATOR') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (currentUser?.role === 'MODERATOR') {
      fetchUsers();
    }
  }, [page, currentUser]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersApi.getAllUsers(page, 20);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      setProcessingUsers((prev) => new Set(prev).add(userId));
      await usersApi.banUser(userId);
      // Refresh users list
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to ban user');
    } finally {
      setProcessingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
      setProcessingUsers((prev) => new Set(prev).add(userId));
      await usersApi.unbanUser(userId);
      // Refresh users list
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to unban user');
    } finally {
      setProcessingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      setProcessingUsers((prev) => new Set(prev).add(userId));
      await usersApi.deleteUser(userId);
      // Refresh users list
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete user');
    } finally {
      setProcessingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (!isAuthenticated || currentUser?.role !== 'MODERATOR') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Moderator Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage users, view statuses, and moderate content</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by username, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Users ({pagination?.totalCount || 0})</span>
              {pagination && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-600 text-lg font-medium">Failed to load users</p>
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                  <Button onClick={fetchUsers} className="mt-4" variant="outline">
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No users found</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredUsers.map((user) => {
                    const isProcessing = processingUsers.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <Link href={`/profile/${user.id}`}>
                            <Avatar
                              src={user.avatarUrl}
                              name={user.displayName || user.username}
                              username={user.username}
                              size="md"
                            />
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/profile/${user.id}`}
                                className="font-semibold text-gray-900 hover:underline"
                              >
                                {user.displayName || user.username}
                              </Link>
                              {user.role === 'MODERATOR' && (
                                <span className="px-2 py-0.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center space-x-1">
                                  <Shield className="w-3 h-3" />
                                  <span>MODERATOR</span>
                                </span>
                              )}
                              {user.banned && (
                                <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full flex items-center space-x-1">
                                  <Ban className="w-3 h-3" />
                                  <span>BANNED</span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                            {user.email && (
                              <p className="text-xs text-gray-400">{user.email}</p>
                            )}
                            {user.bio && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/profile/${user.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          {user.banned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnban(user.id)}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBan(user.id)}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNext || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






