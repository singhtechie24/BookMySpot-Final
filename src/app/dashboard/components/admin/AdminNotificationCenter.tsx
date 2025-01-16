'use client';

import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { User } from '@/services/userService';
import { Notification, subscribeToNotifications, markNotificationAsRead } from '@/services/notificationService';

interface AdminNotificationCenterProps {
  user: User;
}

export default function AdminNotificationCenter({ user }: AdminNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications.slice(0, 5)); // Only show latest 5 notifications
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <FaBell className="mx-auto text-2xl mb-2" />
        <p>No new notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg ${
            notification.status === 'unread' ? 'bg-gray-700' : 'bg-gray-800'
          }`}
          onClick={() => notification.status === 'unread' && handleMarkAsRead(notification.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className={`text-sm font-medium ${
                notification.status === 'unread' ? 'text-white' : 'text-gray-300'
              }`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {notification.createdAt.toLocaleString()}
              </p>
            </div>
            {notification.status === 'unread' && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 