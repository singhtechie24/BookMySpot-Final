'use client';

import { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { User } from '@/services/userService';
import AdminSidebar from './components/admin/AdminSidebar';
import SpaceOwnerSidebar from './components/space-owner/SpaceOwnerSidebar';
import UserSidebar from './components/user/UserSidebar';
import { auth, db } from '@/config/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              id: userDoc.id,
              ...userDoc.data()
            } as User);
          } else {
            console.error('User document not found');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        router.push('/auth/signin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderSidebar = () => {
    switch (user.role) {
      case 'admin':
        return <AdminSidebar user={user} />;
      case 'space-owner':
        return <SpaceOwnerSidebar user={user} />;
      default:
        return <UserSidebar user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
      >
        {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}>
        {renderSidebar()}
      </div>

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out pt-16 lg:pt-0
        ${isSidebarOpen ? 'lg:pl-64' : 'pl-0'} lg:pl-64`}>
        <main className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-4 lg:py-6">
            <Toaster position="top-right" />
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Footer */}
      <div className={`${isSidebarOpen ? 'lg:pl-64' : 'pl-0'} lg:pl-64`}>
        <Footer />
      </div>
    </div>
  );
} 