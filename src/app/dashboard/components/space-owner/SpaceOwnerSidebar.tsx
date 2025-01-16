'use client';

import { useState } from 'react';
import { User } from '@/services/userService';
import { 
  FaChartLine, 
  FaParking, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaUser, 
  FaBell,
  FaChartBar,
  FaPlus,
  FaSignOutAlt,
  FaComments,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SpaceOwnerSidebarProps {
  user: User;
}

export default function SpaceOwnerSidebar({ user }: SpaceOwnerSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: FaChartLine, label: 'Dashboard' },
    { path: '/dashboard/my-spots', icon: FaParking, label: 'My Spots' },
    { path: '/dashboard/my-spots/add', icon: FaPlus, label: 'Add New Spot' },
    { path: '/dashboard/my-requests', icon: FaClipboardList, label: 'My Requests' },
    { path: '/dashboard/bookings', icon: FaCalendarAlt, label: 'Bookings' },
    { path: '/dashboard/analytics', icon: FaChartBar, label: 'Analytics' },
    { path: '/dashboard/feedback', icon: FaComments, label: 'Feedback' }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
      >
        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-800 transform transition-transform duration-200 ease-in-out
        lg:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <h1 className="text-white text-xl font-bold">
            Space Owner Dashboard
          </h1>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
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
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center space-x-2 text-gray-400 hover:text-white ${
              pathname === '/dashboard/notifications' ? 'text-white' : ''
            }`}
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
              <p className="text-sm font-medium text-white truncate max-w-[180px]">{user.email}</p>
              <p className="text-xs text-gray-400">Space Owner</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <FaSignOutAlt className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
} 