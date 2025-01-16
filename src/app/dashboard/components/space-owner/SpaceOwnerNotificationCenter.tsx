'use client';

import { useState, useEffect } from 'react';
import { User } from '@/services/userService';
import { FaBell, FaCheck } from 'react-icons/fa';
import { Notification } from '@/types/notification';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import { format } from 'date-fns';

interface SpaceOwnerNotificationCenterProps {
  user: User;
}

export default function SpaceOwnerNotificationCenter({ user }: SpaceOwnerNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
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
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">
          {notifications.filter(n => n.status === 'unread').length} unread
        </span>
        {notifications.some(n => n.status === 'unread') && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <FaCheck className="text-xs" />
            Mark all as read
          </button>
        )}
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg ${
              notification.status === 'unread'
                ? 'bg-gray-700'
                : 'bg-gray-800'
            }`}
            onClick={() => notification.status === 'unread' && handleMarkAsRead(notification.id)}
          >
            <div className="flex justify-between items-start">
              <h4 className={`text-sm font-medium ${
                notification.status === 'unread' ? 'text-white' : 'text-gray-300'
              }`}>
                {notification.title}
              </h4>
              {notification.status === 'unread' && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {format(notification.createdAt, 'MMM d, h:mm a')}
              </span>
              {notification.action && (
                <a
                  href={notification.action.link}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {notification.action.type === 'view' ? 'View' : 
                   notification.action.type === 'approve' ? 'Approve' : 'Reject'}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 