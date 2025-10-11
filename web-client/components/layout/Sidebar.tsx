'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useRecommendations } from '@/lib/hooks/use-social';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { socialApi } from '@/lib/api/social';
import { useState } from 'react';

export function Sidebar() {
  const { user, isAuthenticated } = useAuthStore();
  const { recommendations, isLoading } = useRecommendations(5, isAuthenticated);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Don't render sidebar if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleFollow = async (userId: string) => {
    try {
      await socialApi.followUser(userId);
      setFollowingIds((prev) => new Set(prev).add(userId));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  return (
    <aside className="hidden lg:block w-80 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="space-y-4">
        {/* User Profile Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar
                src={user?.avatar_url}
                name={user?.display_name || user?.username}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.display_name || user?.username}
                </p>
                <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
              </div>
            </div>
            <Link href={`/profile/${user?.id}`}>
              <Button variant="outline" size="sm" className="w-full mt-3">
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Who to Follow */}
        {!isLoading && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Who to follow</h3>
            </CardHeader>
            <CardContent className="p-0">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <Link
                    href={`/profile/${rec.id}`}
                    className="flex items-center space-x-3 flex-1 min-w-0"
                  >
                    <Avatar
                      src={rec.avatar_url}
                      name={rec.display_name || rec.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {rec.display_name || rec.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{rec.username}
                      </p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={followingIds.has(rec.id) ? 'secondary' : 'primary'}
                    onClick={() => handleFollow(rec.id)}
                    disabled={followingIds.has(rec.id)}
                  >
                    {followingIds.has(rec.id) ? 'Following' : 'Follow'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-xs text-gray-500 px-4 space-x-2">
          <a href="#" className="hover:underline">
            About
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            Help
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            Privacy
          </a>
        </div>
      </div>
    </aside>
  );
}

