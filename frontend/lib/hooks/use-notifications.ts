import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications';
import { Notification } from '@/types';
import { useNotificationStore } from '../stores/notification-store';

export function useNotifications(page = 1, limit = 20, unreadOnly = false) {
  const storeNotifications = useNotificationStore((state) => state.notifications);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchNotifications = useCallback(async () => {
    // Check if token exists before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        setError('Authentication required');
        setNotifications([]);
        setHasMore(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.getNotifications(page, limit, unreadOnly);
      // Ensure we always set an array
      setNotifications(Array.isArray(response?.data?.notifications) ? response.data.notifications : []);
      setHasMore(response?.data?.pagination?.has_next || false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      // Set empty array on error to prevent .map() issues
      setNotifications([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const { markAsRead: markAsReadStore } = useNotificationStore.getState();
    await notificationsApi.markAsRead(notificationId);
    markAsReadStore(notificationId);
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    const { markAllAsRead: markAllAsReadStore } = useNotificationStore.getState();
    await notificationsApi.markAllAsRead();
    markAllAsReadStore();
    setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    await notificationsApi.deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
    // Update unread count in store if needed
    const { setUnreadCount } = useNotificationStore.getState();
    const deletedNotif = notifications.find((n) => n._id === notificationId);
    if (deletedNotif && !deletedNotif.is_read) {
      const currentCount = useNotificationStore.getState().unreadCount;
      if (currentCount > 0) {
        setUnreadCount(currentCount - 1);
      }
    }
  };

  const deleteAllNotifications = async () => {
    await notificationsApi.deleteAllNotifications();
    setNotifications([]);
    // Reset unread count in store
    const { setUnreadCount } = useNotificationStore.getState();
    setUnreadCount(0);
  };

  return {
    notifications,
    isLoading,
    error,
    hasMore,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}

export function useUnreadCount(enabled = true) {
  const storeUnreadCount = useNotificationStore((state) => state.unreadCount);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    // Only fetch if enabled (authenticated)
    if (!enabled) {
      setIsLoading(false);
      setCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const unreadCount = await notificationsApi.getUnreadCount();
      setCount(unreadCount);
      useNotificationStore.getState().setUnreadCount(unreadCount);
    } catch (err) {
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchCount();
    
    // Poll for updates every 30 seconds only if enabled
    if (enabled) {
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchCount, enabled]);

  // Use store value if available, otherwise use fetched value
  const currentCount = storeUnreadCount > 0 ? storeUnreadCount : count;

  return { count: currentCount, isLoading, refetch: fetchCount };
}

