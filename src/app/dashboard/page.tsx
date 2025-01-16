'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminDashboard from './components/admin/AdminDashboard';
import SpaceOwnerDashboard from './components/space-owner/SpaceOwnerDashboard';
import UserDashboard from './components/user/UserDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/signup');
      return;
    }
    // Debug logging
    console.log('Current user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      // Log the entire user object to see all properties
      user
    });
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Normalize role to use hyphen format
  const normalizedRole = user.role?.toLowerCase().replace(/_/g, '-') || 'user';
  console.log('User role:', user.role, 'Normalized role:', normalizedRole);

  switch (normalizedRole) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'space-owner':
      return <SpaceOwnerDashboard user={user} />;
    case 'user':
      return <UserDashboard user={user} />;
    default:
      console.error('Unknown user role:', user.role, 'Normalized role:', normalizedRole);
      return <UserDashboard user={user} />;
  }
} 