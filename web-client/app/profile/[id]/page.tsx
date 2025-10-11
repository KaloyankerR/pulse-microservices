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
import { useSocialStats, useFollowStatus } from '@/lib/hooks/use-social';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatNumber } from '@/lib/utils';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { posts, isLoading: postsLoading } = useUserPosts(userId);
  const { stats } = useSocialStats(userId);
  const { status, follow, unfollow } = useFollowStatus(userId);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const data = await usersApi.getUserById(userId);
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
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
                src={user.avatar_url}
                name={user.display_name || user.username}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.display_name || user.username}
                    </h1>
                    <p className="text-gray-500">@{user.username}</p>
                  </div>
                  {!isOwnProfile && (
                    <Button
                      onClick={status?.is_following ? unfollow : follow}
                      variant={status?.is_following ? 'secondary' : 'primary'}
                    >
                      {status?.is_following ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>

                {user.bio && (
                  <p className="mt-3 text-gray-700">{user.bio}</p>
                )}

                <div className="flex items-center space-x-6 mt-4">
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatNumber(stats?.followers_count || 0)}
                    </span>
                    <span className="text-gray-500 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">
                      {formatNumber(stats?.following_count || 0)}
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

