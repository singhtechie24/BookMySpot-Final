'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '@/types/notification';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {}
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      if (!user?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        unsubscribe = subscribeToNotifications(user.id, (updatedNotifications) => {
          setNotifications(updatedNotifications);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up notifications subscription:', error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    
    // Optimistically update the UI
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: 'read' }
          : notification
      )
    );
    
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'unread' }
            : notification
        )
      );
      throw error;
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    // Optimistically update the UI
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, status: 'read' }))
    );
    
    try {
      await markAllNotificationsAsRead(user.id);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert on error
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, status: 'unread' }))
      );
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <NotificationsContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
} 