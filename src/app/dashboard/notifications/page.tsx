'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types/notification';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import { FaBell, FaCheck, FaRegBell, FaTimes, FaCalendar, FaDollarSign, FaBan } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNotifications } from '@/context/NotificationsContext';
import { format, isToday, isYesterday } from 'date-fns';

export default function NotificationsPage() {
  const { notifications, loading, unreadCount } = useNotifications();
  const [selectedType, setSelectedType] = useState<string>('all');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      router.push('/login');
    }
  }, [user?.id, router]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await markAllNotificationsAsRead(user.id);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'spot_request_approved':
        return <FaCheck className="text-green-400" />;
      case 'spot_request_rejected':
        return <FaTimes className="text-red-400" />;
      case 'new_booking':
        return <FaCalendar className="text-blue-400" />;
      case 'booking_payment':
        return <FaDollarSign className="text-yellow-400" />;
      case 'booking_cancelled':
        return <FaBan className="text-red-400" />;
      default:
        return <FaBell className="text-gray-400" />;
    }
  };

  const notificationTypes = [
    { value: 'all', label: 'All' },
    { value: 'spot_request_approved', label: 'Approvals' },
    { value: 'new_booking', label: 'Bookings' },
    { value: 'booking_payment', label: 'Payments' },
    { value: 'booking_cancelled', label: 'Cancellations' },
  ];

  const filteredNotifications = notifications.filter(notification => 
    selectedType === 'all' || notification.type === selectedType
  );

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    notifications.forEach(notification => {
      const date = notification.createdAt;
      let dateKey = '';
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    return groups;
  };

  const getNotificationStats = () => {
    return {
      total: notifications.length,
      unread: unreadCount,
      today: notifications.filter(n => isToday(n.createdAt)).length,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = getNotificationStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FaBell className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Notifications</p>
                <p className="text-xl font-semibold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <FaRegBell className="text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Unread</p>
                <p className="text-xl font-semibold text-white">{stats.unread}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FaCalendar className="text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Today</p>
                <p className="text-xl font-semibold text-white">{stats.today}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {notificationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedType === type.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {filteredNotifications.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <FaRegBell className="mx-auto text-5xl text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
            <p className="text-gray-400">
              {selectedType === 'all'
                ? "You don't have any notifications yet"
                : `You don't have any ${notificationTypes.find(t => t.value === selectedType)?.label.toLowerCase() || ''} notifications`}
            </p>
          </div>
        ) : (
          Object.entries(groupNotificationsByDate(filteredNotifications)).map(([date, notifications]) => (
            <div key={date} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-400">{date}</h2>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-gray-800 rounded-lg p-4 transition-all hover:bg-gray-750 ${
                      !notification.read ? 'border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${
                          !notification.read ? 'bg-blue-500/10' : 'bg-gray-700'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm text-white">{notification.title}</h3>
                          <p className="text-sm text-gray-400">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(notification.createdAt, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors whitespace-nowrap"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 