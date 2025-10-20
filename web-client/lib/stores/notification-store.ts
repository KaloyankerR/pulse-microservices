import { create } from 'zustand';
import { Notification as NotificationType } from '@/types';

interface NotificationStore {
  notifications: NotificationType[];
  unreadCount: number;
  addNotification: (notification: NotificationType) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: NotificationType[]) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif._id === notificationId
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notif) => ({
        ...notif,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((notif) => !notif.is_read).length,
    }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));
