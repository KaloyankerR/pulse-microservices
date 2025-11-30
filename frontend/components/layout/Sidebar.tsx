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
  const { isAuthenticated } = useAuthStore();
  const { recommendations, isLoading } = useRecommendations(5, isAuthenticated);
  const { events, isLoading: eventsLoading } = useEvents(0, 5);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Don't render sidebar if not authenticated
  if (!isAuthenticated) {
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
    <aside className="hidden lg:block w-80 sticky top-0 h-screen overflow-y-auto bg-[#B8D4A8] border-l-[3px] border-[#1A1A1A] p-6">
      <div className="space-y-6">
        {/* Who to Follow */}
        {!isLoading && recommendations.length > 0 && (
          <Card variant="cream">
            <CardHeader>
              <h3 className="font-black text-[#1A1A1A]">Who to follow</h3>
            </CardHeader>
            <CardContent className="p-0">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.id || `rec-${index}`}
                  className="flex items-center justify-between p-4 border-b-[2px] border-[#1A1A1A] last:border-b-0 hover:bg-[#F5EFE7]"
                  style={{ transition: 'none' }}
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
                        <p className="font-black text-[#1A1A1A] truncate">
                          {rec.displayName || rec.username}
                        </p>
                        {rec.role === 'MODERATOR' && (
                          <span className="px-1.5 py-0.5 text-xs font-black bg-[#87CEEB] text-[#1A1A1A] border-[2px] border-[#1A1A1A] inline-block shadow-[2px_2px_0px_#1A1A1A] flex-shrink-0">
                            MOD
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A] opacity-70 truncate">
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
          <Card variant="cream">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[#1A1A1A]">Upcoming Events</h3>
                <Link href="/events" className="text-sm font-bold text-[#1A1A1A] hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {events.slice(0, 3).map((event, index) => (
                <div
                  key={event.id || `event-${index}`}
                  className="p-4 border-b-[2px] border-[#1A1A1A] last:border-b-0 hover:bg-[#F5EFE7]"
                  style={{ transition: 'none' }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {event.event_type === 'PHYSICAL' ? (
                        <MapPin className="w-4 h-4 text-[#1A1A1A] mt-1" />
                      ) : (
                        <Video className="w-4 h-4 text-[#1A1A1A] mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/events/${event.id}`}
                        className="block hover:underline"
                      >
                        <p className="font-black text-[#1A1A1A] truncate">
                          {event.title}
                        </p>
                      </Link>
                      <p className="text-sm font-bold text-[#1A1A1A] opacity-70 mt-1">
                        {new Date(event.start_date).toLocaleDateString([], { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex items-center mt-2 text-xs font-bold text-[#1A1A1A] opacity-70">
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
      </div>
    </aside>
  );
}

