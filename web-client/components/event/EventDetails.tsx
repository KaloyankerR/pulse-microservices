'use client';

import { useState } from 'react';
import { Event, EventAttendee, RsvpStatus } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { MapPin, Video, Calendar, Users, CheckCircle, HelpCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

interface EventDetailsProps {
  event: Event;
  attendees: EventAttendee[];
  onRsvp?: (status: RsvpStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAttendeesLoading?: boolean;
}

export function EventDetails({ 
  event, 
  attendees, 
  onRsvp, 
  onEdit, 
  onDelete, 
  isAttendeesLoading = false 
}: EventDetailsProps) {
  const { user } = useAuthStore();
  const isOwnEvent = user?.id === event.creator_id;
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'YES' | 'MAYBE' | 'NO'>('YES');

  const handleRsvp = async (status: RsvpStatus) => {
    if (isRsvpLoading) return;
    
    try {
      setIsRsvpLoading(true);
      await onRsvp?.(status);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsRsvpLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getAttendeesByStatus = (status: RsvpStatus) => {
    return attendees.filter(attendee => attendee.rsvp_status === status);
  };

  const tabs = [
    { key: 'YES' as const, label: 'Going', count: getAttendeesByStatus('YES').length, icon: CheckCircle, color: 'text-green-600' },
    { key: 'MAYBE' as const, label: 'Maybe', count: getAttendeesByStatus('MAYBE').length, icon: HelpCircle, color: 'text-yellow-600' },
    { key: 'NO' as const, label: 'Not Going', count: getAttendeesByStatus('NO').length, icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Event Header */}
      <Card>
        <CardContent className="p-6">
          {/* Creator Info */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/profile/${event.creator_id}`}
              className="flex items-center space-x-3"
            >
              <Avatar
                src={event.creator?.avatarUrl}
                name={event.creator?.displayName || event.creator?.username}
                username={event.creator?.username}
                size="lg"
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
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onEdit}
                  className="flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Event Type Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              event.event_type === 'PHYSICAL' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {event.event_type === 'PHYSICAL' ? (
                <>
                  <MapPin className="w-4 h-4 mr-1" />
                  Physical Event
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-1" />
                  Virtual Event
                </>
              )}
            </span>
          </div>

          {/* Event Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

          {/* Event Description */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Start</p>
                <p className="text-sm">{formatEventDate(event.start_date)}</p>
              </div>
            </div>
            
            {event.end_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">End</p>
                  <p className="text-sm">{formatEventDate(event.end_date)}</p>
                </div>
              </div>
            )}
            
            {event.event_type === 'PHYSICAL' && event.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm">{event.location}</p>
                </div>
              </div>
            )}
            
            {event.event_type === 'VIRTUAL' && event.virtual_link && (
              <div className="flex items-center text-gray-600">
                <Video className="w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium">Virtual Link</p>
                  <a 
                    href={event.virtual_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Join Virtual Event
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* RSVP Section */}
          {user && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP</h3>
              <div className="flex space-x-3">
                <Button
                  variant={getRsvpButtonVariant('YES')}
                  onClick={() => handleRsvp('YES')}
                  disabled={isRsvpLoading}
                  className="flex items-center"
                >
                  {getRsvpButtonIcon('YES')}
                  <span className="ml-2">{getRsvpButtonText('YES')}</span>
                </Button>
                <Button
                  variant={getRsvpButtonVariant('MAYBE')}
                  onClick={() => handleRsvp('MAYBE')}
                  disabled={isRsvpLoading}
                  className="flex items-center"
                >
                  {getRsvpButtonIcon('MAYBE')}
                  <span className="ml-2">{getRsvpButtonText('MAYBE')}</span>
                </Button>
                <Button
                  variant={getRsvpButtonVariant('NO')}
                  onClick={() => handleRsvp('NO')}
                  disabled={isRsvpLoading}
                  className="flex items-center"
                >
                  {getRsvpButtonIcon('NO')}
                  <span className="ml-2">{getRsvpButtonText('NO')}</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendees Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Attendees ({attendees.length})
            </h2>
            <div className="flex space-x-4 text-sm text-gray-500">
              {tabs.map(tab => (
                <span key={tab.key} className={tab.color}>
                  {tab.count} {tab.label}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Attendees List */}
          {isAttendeesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading attendees...</p>
            </div>
          ) : getAttendeesByStatus(activeTab).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAttendeesByStatus(activeTab).map((attendee) => (
                <div key={attendee.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Link href={`/profile/${attendee.id}`}>
                    <Avatar
                      src={attendee.avatarUrl}
                      name={attendee.displayName || attendee.username}
                      username={attendee.username}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/profile/${attendee.id}`}
                      className="font-medium text-gray-900 hover:underline block truncate"
                    >
                      {attendee.displayName || attendee.username}
                    </Link>
                    <p className="text-sm text-gray-500 truncate">@{attendee.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {activeTab.toLowerCase()} responses yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
