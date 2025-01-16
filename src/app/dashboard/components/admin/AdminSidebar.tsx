'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FaUser,
  FaChartBar,
  FaUsers,
  FaParking,
  FaClipboardList,
  FaCalendarAlt,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaComments
} from 'react-icons/fa';
import { useNotifications } from '@/context/NotificationsContext';
import { User } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  user: User;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { signOut } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signup');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col h-full text-gray-400">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white mb-4">Administrator Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-gray-700">
            <FaUser className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-white">{user.email}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link
          href="/dashboard"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaChartBar className="text-lg" />
          <span>Overview</span>
        </Link>

        <Link
          href="/dashboard/users"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard/users')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaUsers className="text-lg" />
          <span>Users</span>
        </Link>

        <Link
          href="/dashboard/parking"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard/parking')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaParking className="text-lg" />
          <span>Parking Spots</span>
        </Link>

        <Link
          href="/dashboard/requests"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard/requests')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaClipboardList className="text-lg" />
          <span>Requests</span>
        </Link>

        <Link
          href="/dashboard/bookings"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard/bookings')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaCalendarAlt className="text-lg" />
          <span>Bookings</span>
        </Link>

        <Link
          href="/dashboard/analytics"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard/analytics')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaChartLine className="text-lg" />
          <span>Analytics</span>
        </Link>

        <Link
          href="/dashboard/feedback"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
            isActive('/dashboard/feedback')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <FaComments className="text-lg" />
          <span>Feedback</span>
        </Link>

        <Link
          href="/dashboard/notifications"
          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
            isActive('/dashboard/notifications')
              ? 'bg-gray-700 text-white'
              : 'hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <FaBell className="text-lg" />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 p-3 rounded-lg transition-colors w-full hover:bg-gray-700/50 hover:text-white"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 