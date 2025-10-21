'use client';

import { useState } from 'react';
import { Event, RsvpStatus } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MapPin, Video, Calendar, Users, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

interface EventCardProps {
  event: Event;
  onRsvp?: (eventId: string, status: RsvpStatus) => void;
  onDelete?: (eventId: string) => void;
  showDetails?: boolean;
}

export function EventCard({ event, onRsvp, onDelete, showDetails = false }: EventCardProps) {
  const { user } = useAuthStore();
  const isOwnEvent = user?.id === (event.creator?.id || (event.creator_id === 'current_user' ? user?.id : event.creator_id));
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);

  const handleRsvp = async (status: RsvpStatus) => {
    if (isRsvpLoading) return;
    
    try {
      setIsRsvpLoading(true);
      await onRsvp?.(event.id, status);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsRsvpLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getRsvpButtonVariant = (status: RsvpStatus) => {
    if (event.user_rsvp === status) {
      return 'primary';
    }
    return 'secondary';
  };

  const getRsvpButtonIcon = (status: RsvpStatus) => {
    switch (status) {
      case 'YES':
        return <CheckCircle className="w-4 h-4" />;
      case 'MAYBE':
        return <HelpCircle className="w-4 h-4" />;
      case 'NO':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getRsvpButtonText = (status: RsvpStatus) => {
    if (event.user_rsvp === status) {
      return status === 'YES' ? 'Going' : status === 'MAYBE' ? 'Maybe' : 'Not Going';
    }
    return status === 'YES' ? 'Going' : status === 'MAYBE' ? 'Maybe' : 'Not Going';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link
            href={`/profile/${event.creator?.id || (event.creator_id === 'current_user' ? user?.id : event.creator_id)}`}
            className="flex items-center space-x-3 flex-1"
          >
            <Avatar
              src={event.creator?.avatarUrl}
              name={event.creator?.displayName || event.creator?.username}
              username={event.creator?.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900 hover:underline">
                {event.creator?.displayName || event.creator?.username}
              </p>
              <p className="text-sm text-gray-500">
                @{event.creator?.username} · {formatRelativeTime(event.created_at)}
              </p>
            </div>
          </Link>

          {isOwnEvent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(event.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>

        {/* Event Type Badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            event.event_type === 'PHYSICAL' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {event.event_type === 'PHYSICAL' ? (
              <>
                <MapPin className="w-3 h-3 mr-1" />
                Physical Event
              </>
            ) : (
              <>
                <Video className="w-3 h-3 mr-1" />
                Virtual Event
              </>
            )}
          </span>
        </div>

        {/* Event Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>

        {/* Event Description */}
        <p className="text-gray-700 mb-4 line-clamp-3">
          {showDetails ? event.description : event.description.length > 150 
            ? `${event.description.substring(0, 150)}...` 
            : event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatEventDate(event.start_date)}</span>
          </div>
          
          {event.event_type === 'PHYSICAL' && event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{event.location}</span>
            </div>
          )}
          
          {event.event_type === 'VIRTUAL' && event.virtual_link && (
            <div className="flex items-center text-sm text-gray-600">
              <Video className="w-4 h-4 mr-2" />
              <a 
                href={event.virtual_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Join Virtual Event
              </a>
            </div>
          )}
        </div>

        {/* RSVP Counts */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="font-medium">{event.rsvp_counts.yes}</span>
            </div>
            <div className="flex items-center text-yellow-600">
              <HelpCircle className="w-4 h-4 mr-1" />
              <span className="font-medium">{event.rsvp_counts.maybe}</span>
            </div>
            <div className="flex items-center text-red-600">
              <XCircle className="w-4 h-4 mr-1" />
              <span className="font-medium">{event.rsvp_counts.no}</span>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-1" />
            <span>{event.rsvp_counts.yes + event.rsvp_counts.maybe + event.rsvp_counts.no} total</span>
          </div>
        </div>

        {/* RSVP Buttons */}
        {user && (
          <div className="flex space-x-2">
            <Button
              variant={getRsvpButtonVariant('YES')}
              size="sm"
              onClick={() => handleRsvp('YES')}
              disabled={isRsvpLoading}
              className="flex-1"
            >
              {getRsvpButtonIcon('YES')}
              <span className="ml-1">{getRsvpButtonText('YES')}</span>
            </Button>
            <Button
              variant={getRsvpButtonVariant('MAYBE')}
              size="sm"
              onClick={() => handleRsvp('MAYBE')}
              disabled={isRsvpLoading}
              className="flex-1"
            >
              {getRsvpButtonIcon('MAYBE')}
              <span className="ml-1">{getRsvpButtonText('MAYBE')}</span>
            </Button>
            <Button
              variant={getRsvpButtonVariant('NO')}
              size="sm"
              onClick={() => handleRsvp('NO')}
              disabled={isRsvpLoading}
              className="flex-1"
            >
              {getRsvpButtonIcon('NO')}
              <span className="ml-1">{getRsvpButtonText('NO')}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
