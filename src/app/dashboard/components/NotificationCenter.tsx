'use client';

import { useEffect, useState } from 'react';
import { Notification, subscribeToNotifications, markNotificationAsRead } from '@/services/notificationService';
import { FaBell, FaCheck, FaTimes, FaParking, FaCalendar } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  user: {
    id: string;
    role: string;
  };
}

export default function NotificationCenter({ user }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => n.status === 'unread').length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'request':
        return <FaParking className="text-blue-400" />;
      case 'approval':
        return <FaCheck className="text-green-400" />;
      case 'rejection':
        return <FaTimes className="text-red-400" />;
      case 'booking':
        return <FaCalendar className="text-purple-400" />;
      default:
        return <FaBell className="text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white focus:outline-none"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-base font-semibold text-white">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                    notification.status === 'unread' ? 'bg-gray-750' : ''
                  }`}
                  onClick={() => notification.status === 'unread' && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notificationType)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 