'use client';

import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { Heart, UserPlus, MessageCircle, Bell, Trash2, X } from 'lucide-react';
import { NotificationType } from '@/types';
import { useState } from 'react';

const notificationIcons: Record<NotificationType, any> = {
  LIKE: Heart,
  FOLLOW: UserPlus,
  COMMENT: MessageCircle,
  MESSAGE: MessageCircle,
  SYSTEM: Bell,
  POST_MENTION: MessageCircle,
  POST_SHARE: MessageCircle,
};

interface NotificationsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPopup({ isOpen, onClose }: NotificationsPopupProps) {
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } =
    useNotifications();
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />

      {/* Popup */}
      <div
        ref={popupRef}
        className="fixed lg:absolute right-4 lg:right-0 top-16 lg:top-full lg:mt-2 w-[calc(100vw-2rem)] lg:w-96 lg:max-w-md max-h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteAllConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete All
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-2">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;

                return (
                  <Card
                    key={notification._id}
                    className={`hover:shadow-md transition-shadow ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        {notification.sender ? (
                          <Link
                            href={`/profile/${notification.sender.id}`}
                            onClick={onClose}
                          >
                            <Avatar
                              src={notification.sender.avatarUrl}
                              name={notification.sender.username}
                              username={notification.sender.username}
                              size="md"
                            />
                          </Link>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                        )}

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification._id);
                            }
                          }}
                        >
                          <p className="text-gray-900 font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete All Notifications?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await deleteAllNotifications();
                  setShowDeleteAllConfirm(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

