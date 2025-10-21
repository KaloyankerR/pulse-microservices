import { useEffect } from 'react';
import { useWebSocket } from './use-websocket';
import { useNotificationStore } from '../stores/notification-store';
import { Notification as NotificationType } from '@/types';

export function useNotificationWebSocket() {
  const { addNotification, incrementUnreadCount } = useNotificationStore();

  const { isConnected, error } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'notification.created':
          if (message.data) {
            const notification: NotificationType = {
              _id: message.data._id || message.data.id,
              recipient_id: message.data.recipient_id,
              sender_id: message.data.sender_id,
              type: message.data.type,
              title: message.data.title,
              message: message.data.message,
              reference_id: message.data.reference_id,
              reference_type: message.data.reference_type,
              is_read: false,
              priority: message.data.priority || 'MEDIUM',
              created_at: message.data.created_at || new Date().toISOString(),
              metadata: message.data.metadata || {},
              sender: message.data.sender,
            };
            
            addNotification(notification);
            
            // Show browser notification if permission is granted
            if (typeof window !== 'undefined' && window.Notification && window.Notification.permission === 'granted') {
              new window.Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification._id,
              });
            }
          }
          break;
        
        case 'notification.read':
          // Handle notification read status updates if needed
          break;
        
        default:
          break;
      }
    },
    onOpen: () => {
      // WebSocket connected
    },
    onClose: () => {
      // WebSocket disconnected
    },
    onError: (error) => {
      // WebSocket error handled by useWebSocket hook
    },
  });

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, []);

  // Connection status monitoring
  useEffect(() => {
    if (error) {
      // Error is handled by the useWebSocket hook
    }
  }, [isConnected, error]);

  return {
    isConnected,
    error,
  };
}
