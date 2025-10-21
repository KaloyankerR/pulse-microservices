'use client';

import { useNotificationWebSocket } from '@/lib/hooks/use-notification-websocket';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection for real-time notifications
  useNotificationWebSocket();

  return <>{children}</>;
}
