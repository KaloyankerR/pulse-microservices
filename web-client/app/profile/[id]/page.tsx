'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/post/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import { User } from '@/types';
import { usersApi } from '@/lib/api/users';
import { useUserPosts } from '@/lib/hooks/use-posts';
import { useFollowStatus, useSocialStats } from '@/lib/hooks/use-social';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatNumber } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { posts, isLoading: postsLoading, error: postsError } = useUserPosts(userId);
  const { follow: followUser, unfollow: unfollowUser } = useFollowStatus(userId);
  const { stats: socialStats, isLoading: statsLoading, refetch: refetchStats } = useSocialStats(userId);

  const follow = async () => {
    try {
      await followUser();
      setUser(prev => prev ? { ...prev, isFollowing: true, followersCount: (prev.followersCount || 0) + 1 } : null);
      // Refetch social stats to get updated counts
      refetchStats();
    } catch (error: any) {
      // Handle 409 - already following (this is expected behavior)
      if (error.response?.status === 409) {
        setUser(prev => prev ? { ...prev, isFollowing: true } : null);
        refetchStats();
        return;
      }
      console.error('Failed to follow user:', error);
    }
  };

  const unfollow = async () => {
    try {
      await unfollowUser();
      setUser(prev => prev ? { ...prev, isFollowing: false, followersCount: Math.max((prev.followersCount || 0) - 1, 0) } : null);
      // Refetch social stats to get updated counts
      refetchStats();
    } catch (error: any) {
      // Handle 404 - not following (this is expected behavior)
      if (error.response?.status === 404) {
        setUser(prev => prev ? { ...prev, isFollowing: false } : null);
        refetchStats();
        return;
      }
      console.error('Failed to unfollow user:', error);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const data = await usersApi.getUserById(userId);
        setUser(data);
      } catch (error: any) {
        // Handle error silently or show user-friendly message
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">User not found</p>
          <p className="text-gray-400 text-sm mt-2">User ID: {userId}</p>
          <p className="text-gray-400 text-sm">Loading: {isLoading ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar
                src={user.avatarUrl}
                name={user.displayName || user.username}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.displayName || user.username}
                    </h1>
                    <p className="text-gray-500">@{user.username}</p>
                  </div>
                  {!isOwnProfile && (
                    <Button
                      onClick={user.isFollowing ? unfollow : follow}
                      variant={user.isFollowing ? 'secondary' : 'primary'}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>

                {user.bio && (
                  <p className="mt-3 text-gray-700">{user.bio}</p>
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
    </div>
  );
}

