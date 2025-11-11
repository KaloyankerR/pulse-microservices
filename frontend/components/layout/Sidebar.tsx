'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useRecommendations } from '@/lib/hooks/use-social';
import { useEvents } from '@/lib/hooks/use-events';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { socialApi } from '@/lib/api/social';
import { useState } from 'react';
import { Calendar, MapPin, Video } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export function Sidebar() {
  const { user, isAuthenticated } = useAuthStore();
  const { recommendations, isLoading } = useRecommendations(5, isAuthenticated);
  const { events, isLoading: eventsLoading } = useEvents(0, 5);
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
                src={user?.avatarUrl}
                name={user?.displayName || user?.username}
                username={user?.username}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">
                    {user?.displayName || user?.username}
                  </p>
                  {user?.role === 'MODERATOR' && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex-shrink-0">
                      MOD
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
              </div>
            </div>
            <Link href={`/profile/${user?.id}`}>
              <Button variant="secondary" size="sm" className="w-full mt-3">
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
              {recommendations.map((rec, index) => (
                <div
                  key={rec.id || `rec-${index}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <Link
                    href={`/profile/${rec.id}`}
                    className="flex items-center space-x-3 flex-1 min-w-0"
                  >
                    <Avatar
                      src={rec.avatarUrl}
                      name={rec.displayName || rec.username}
                      username={rec.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {rec.displayName || rec.username}
                        </p>
                        {rec.role === 'MODERATOR' && (
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex-shrink-0">
                            MOD
                          </span>
                        )}
                      </div>
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

        {/* Upcoming Events */}
        {!eventsLoading && events.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Upcoming Events</h3>
                <Link href="/events" className="text-sm text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {events.slice(0, 3).map((event, index) => (
                <div
                  key={event.id || `event-${index}`}
                  className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {event.event_type === 'PHYSICAL' ? (
                        <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                      ) : (
                        <Video className="w-4 h-4 text-purple-600 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/events/${event.id}`}
                        className="block hover:underline"
                      >
                        <p className="font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.start_date).toLocaleDateString([], { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>
                          {event.rsvp_counts.yes + event.rsvp_counts.maybe} going
                        </span>
                      </div>
                    </div>
                  </div>
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

