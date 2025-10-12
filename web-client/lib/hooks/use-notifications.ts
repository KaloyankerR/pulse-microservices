import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications';
import { Notification } from '@/types';

export function useNotifications(page = 1, limit = 20, unreadOnly = false) {
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
      setNotifications(Array.isArray(response?.data?.items) ? response.data.items : []);
      setHasMore(response?.data?.pagination?.page < response?.data?.pagination?.total_pages);
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
    await notificationsApi.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  return {
    notifications,
    isLoading,
    error,
    hasMore,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}

export function useUnreadCount(enabled = true) {
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
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
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

  return { count, isLoading, refetch: fetchCount };
}

