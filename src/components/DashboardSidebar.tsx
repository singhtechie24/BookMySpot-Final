'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaParking, FaUsers, FaCalendar, FaClipboardList, FaBell } from 'react-icons/fa';
import { useNotifications } from '@/context/NotificationsContext';
import { User } from '@/services/userService';

interface DashboardSidebarProps {
  user: User;
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    {
      label: 'Dashboard',
      icon: FaHome,
      href: '/dashboard',
      roles: ['admin', 'user', 'space_owner'],
    },
    {
      label: 'Parking Spots',
      icon: FaParking,
      href: '/dashboard/spots',
      roles: ['admin', 'space_owner'],
    },
    {
      label: 'Users',
      icon: FaUsers,
      href: '/dashboard/users',
      roles: ['admin'],
    },
    {
      label: 'Bookings',
      icon: FaCalendar,
      href: '/dashboard/bookings',
      roles: ['admin', 'user', 'space_owner'],
    },
    {
      label: 'Requests',
      icon: FaClipboardList,
      href: '/dashboard/requests',
      roles: ['admin', 'space_owner'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-gray-800 text-white border-none">
      {/* User Profile */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="font-medium text-white">{user.name || 'User'}</h3>
            <p className="text-sm text-gray-400">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notifications */}
      <div className="p-4 border-t border-gray-700">
        <Link
          href="/dashboard/notifications"
          className="flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FaBell className={unreadCount > 0 ? 'text-blue-500' : ''} />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
} 