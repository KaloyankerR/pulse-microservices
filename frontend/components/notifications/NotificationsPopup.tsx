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
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications(1, 20, false, isOpen);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    setShowDeleteAllConfirm(false);
  };

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


  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed lg:absolute left-16 sm:left-20 lg:left-full top-16 lg:top-16 lg:ml-4 lg:mt-2 w-[calc(100vw-4rem-4rem)] sm:w-[calc(100vw-2rem-5rem)] lg:w-96 lg:max-w-md max-h-[calc(100vh-8rem)] lg:max-h-[600px] bg-white border-[3px] border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] z-50 flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[3px] border-[#1A1A1A] bg-[#F4C542]">
          <h2 className="text-lg font-black text-[#1A1A1A]">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <Button variant="secondary" size="sm" onClick={() => markAllAsRead()}>
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteAllConfirm(true)}
              >
                Delete All
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 border-[3px] border-[#1A1A1A] bg-white hover:bg-[#F5EFE7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A]"
              aria-label="Close notifications"
              style={{ transition: 'none' }}
            >
              <X className="w-5 h-5 text-[#1A1A1A]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Bell className="w-16 h-16 text-[#1A1A1A] opacity-30 mx-auto mb-4" />
              <p className="text-[#1A1A1A] text-lg font-black">No notifications yet</p>
              <p className="text-[#1A1A1A] text-sm mt-2 font-bold opacity-70">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;

                return (
                  <Card
                    key={notification._id}
                    variant={!notification.is_read ? 'blue' : 'default'}
                  >
                    <CardContent className="p-0">
                      <div className="p-3">
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
                            <div className="w-10 h-10 border-[3px] border-[#1A1A1A] bg-[#87CEEB] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#1A1A1A]">
                              <Icon className="w-5 h-5 text-[#1A1A1A]" />
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
                            <p className="text-[#1A1A1A] font-black text-sm">
                              {notification.title}
                            </p>
                            <p className="text-[#1A1A1A] text-xs mt-1 line-clamp-2 font-medium opacity-80">
                              {notification.message}
                            </p>
                            <p className="text-[#1A1A1A] text-xs mt-1 font-bold opacity-70">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <div className="w-3 h-3 bg-[#1A1A1A] border-[2px] border-[#1A1A1A]" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="p-1.5 text-[#FF9B85] hover:text-[#1A1A1A] hover:bg-[#FF9B85] border-[2px] border-[#FF9B85] hover:border-[#1A1A1A]"
                              aria-label="Delete notification"
                              style={{ transition: 'none' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-[#1A1A1A] bg-opacity-80 flex items-center justify-center z-[60]">
          <div className="bg-white border-[3px] border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] p-6 max-w-md mx-4">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-3">
              Delete All Notifications?
            </h3>
            <p className="text-[#1A1A1A] mb-4 font-bold">
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
                variant="danger"
                size="sm"
                onClick={handleDeleteAll}
              >
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

