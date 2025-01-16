'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AdminParkingSpotManagement from '@/app/dashboard/components/admin/AdminParkingSpotManagement';
import SpaceOwnerParkingSpotManagement from '@/app/dashboard/components/space-owner/SpaceOwnerParkingSpotManagement';
import UserParkingView from '@/app/dashboard/components/user/UserParkingView';
import { FaArrowLeft } from 'react-icons/fa';

export default function ParkingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signup');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard" 
          className="text-white hover:text-gray-300 transition-colors"
        >
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="text-3xl font-bold text-white">
          {user.role === 'admin' ? 'Parking Management' : 'My Parking'}
        </h1>
      </div>
      
      {user.role === 'admin' ? (
        <AdminParkingSpotManagement user={user} />
      ) : user.role === 'space-owner' ? (
        <SpaceOwnerParkingSpotManagement user={user} />
      ) : (
        <UserParkingView user={user} />
      )}
    </div>
  );
} 