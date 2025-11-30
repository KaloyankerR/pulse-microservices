'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/post/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { User } from '@/types';
import { usersApi } from '@/lib/api/users';
import { useUserPosts } from '@/lib/hooks/use-posts';
import { useFollowStatus, useSocialStats } from '@/lib/hooks/use-social';
import { socialApi } from '@/lib/api/social';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatNumber } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', bio: '', avatarUrl: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { posts = [], isLoading: postsLoading, error: postsError } = useUserPosts(userId);
  const { status: followStatus, isLoading: followStatusLoading, follow: followUser, unfollow: unfollowUser } = useFollowStatus(userId);
  const { stats: socialStats, isLoading: statsLoading } = useSocialStats(userId);

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userData = await usersApi.getUserById(userId);
        setUser(userData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);


  const isOwnProfile = currentUser?.id === userId;
  const isModerator = currentUser?.role === 'MODERATOR';
  const canEdit = isOwnProfile || isModerator;
  const canDelete = isOwnProfile || isModerator;
  const canBan = isModerator && !isOwnProfile;

  useEffect(() => {
    if (user && isEditing) {
      setEditData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, isEditing]);

  const handleEdit = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      const updatedUser = await usersApi.updateProfileById(userId, editData);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      await usersApi.deleteUser(userId);
      if (isOwnProfile) {
        // If deleting own profile, logout and redirect
        const { logout } = useAuthStore.getState();
        await logout();
        router.push('/');
      } else {
        // If moderator deleting another user, redirect to home
        router.push('/');
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBan = async () => {
    if (!user) return;
    
    try {
      setIsBanning(true);
      await usersApi.banUser(userId);
      setUser({ ...user, banned: true });
      setShowBanConfirm(false);
    } catch (error: any) {
      console.error('Failed to ban user:', error);
      setShowBanConfirm(false);
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnban = async () => {
    if (!user) return;
    
    try {
      setIsUnbanning(true);
      await usersApi.unbanUser(userId);
      setUser({ ...user, banned: false });
    } catch (error: any) {
      console.error('Failed to unban user:', error);
    } finally {
      setIsUnbanning(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12 ml-16 sm:ml-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12 ml-16 sm:ml-20">
          <p className="text-gray-500 text-lg">
            {error || 'User not found'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-gray-400 text-sm mt-2">User ID: {userId}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ml-16 sm:ml-20">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar
                src={user.avatarUrl}
                name={user.displayName || user.username}
                username={user.username}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {user.displayName || user.username}
                      </h1>
                      {user.role === 'MODERATOR' && (
                        <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          MODERATOR
                        </span>
                      )}
                      {user.banned && (
                        <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
                          BANNED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-500">@{user.username}</p>
                      {user.role === 'MODERATOR' && (
                        <span className="text-xs text-blue-600 font-medium">• Verified Moderator</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isOwnProfile && (
                      <Button
                        onClick={followStatus?.is_following ? () => unfollowUser() : () => followUser()}
                        variant={followStatus?.is_following ? 'secondary' : 'primary'}
                        disabled={followStatusLoading}
                      >
                        {followStatusLoading ? 'Loading...' : (followStatus?.is_following ? 'Following' : 'Follow')}
                      </Button>
                    )}
                    {canEdit && !isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && !isEditing && (
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    )}
                    {canBan && !user.banned && (
                      <Button
                        onClick={() => setShowBanConfirm(true)}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Ban
                      </Button>
                    )}
                    {canBan && user.banned && (
                      <Button
                        onClick={handleUnban}
                        variant="secondary"
                        size="sm"
                        disabled={isUnbanning}
                        className="text-green-600 hover:text-green-700"
                      >
                        {isUnbanning ? 'Processing...' : 'Unban'}
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <Input
                        value={editData.displayName}
                        onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                        placeholder="Display Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="Bio"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Avatar URL
                      </label>
                      <Input
                        value={editData.avatarUrl}
                        onChange={(e) => setEditData({ ...editData, avatarUrl: e.target.value })}
                        placeholder="Avatar URL"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleEdit}
                        disabled={isUpdating}
                        variant="primary"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                        }}
                        variant="secondary"
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  user.bio && (
                    <p className="mt-3 text-gray-700">{user.bio}</p>
                  )
                )}
                

                <div className="flex items-center space-x-6 mt-4">
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatNumber(socialStats?.followers_count || user.followersCount || 0)}
                    </span>
                    <span className="text-gray-500 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatNumber(socialStats?.following_count || user.followingCount || 0)}
                    </span>
                    <span className="text-gray-500 ml-1">Following</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatNumber(posts.length)}
                    </span>
                    <span className="text-gray-500 ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Posts</h2>

          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : postsError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-red-500">Error loading posts: {postsError}</p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="primary"
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {showBanConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ban User</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to ban this user? They will not be able to login until unbanned.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowBanConfirm(false)}
                  variant="secondary"
                  disabled={isBanning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBan}
                  variant="primary"
                  disabled={isBanning}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isBanning ? 'Banning...' : 'Ban User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

