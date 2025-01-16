'use client';

import { User } from '@/services/userService';
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaParking, 
  FaClipboardList, 
  FaUser, 
  FaBell,
  FaComments
} from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserSidebarProps {
  user: User;
}

export default function UserSidebar({ user }: UserSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', icon: FaChartLine, label: 'Overview' },
    { path: '/dashboard/my-bookings', icon: FaCalendarAlt, label: 'My Bookings' },
    { path: '/dashboard/favorites', icon: FaParking, label: 'Favorite Spots' },
    { path: '/dashboard/history', icon: FaClipboardList, label: 'History' },
    { path: '/dashboard/feedback', icon: FaComments, label: 'Feedback' }
  ];

  return (
    <div className="w-64 bg-gray-800 min-h-screen flex flex-col">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1 className="text-white text-xl font-bold">
          User Dashboard
        </h1>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <Link 
          href="/dashboard/notifications"
          className="flex items-center space-x-2 text-gray-400 hover:text-white"
        >
          <FaBell className="w-5 h-5" />
          <span>Notifications</span>
        </Link>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="inline-block h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
              <FaUser className="text-gray-300" />
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user.email}</p>
            <p className="text-xs text-gray-400">User</p>
          </div>
        </div>
      </div>
    </div>
  );
} 