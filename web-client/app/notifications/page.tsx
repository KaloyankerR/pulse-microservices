'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { Heart, UserPlus, MessageCircle, Bell } from 'lucide-react';
import { NotificationType } from '@/types';

const notificationIcons: Record<NotificationType, any> = {
  LIKE: Heart,
  FOLLOW: UserPlus,
  COMMENT: MessageCircle,
  MESSAGE: MessageCircle,
  SYSTEM: Bell,
  POST_MENTION: MessageCircle,
  POST_SHARE: MessageCircle,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { notifications, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  // Show authentication message if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to view your notifications.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {notifications.some((n) => !n.is_read) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-2">
                We'll notify you when something happens
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon =
                notificationIcons[notification.type] || Bell;

              return (
                <Card
                  key={notification._id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {notification.sender ? (
                        <Link href={`/profile/${notification.sender.id}`}>
                          <Avatar
                            src={notification.sender.avatarUrl}
                            name={notification.sender.username}
                            size="md"
                          />
                        </Link>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium">
                          {notification.title}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

