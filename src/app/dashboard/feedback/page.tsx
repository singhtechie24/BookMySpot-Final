'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';

export default function FeedbackRouter() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        router.push('/dashboard/feedback/admin');
        break;
      case 'space-owner':
        router.push('/dashboard/feedback/space-owner');
        break;
      default:
        // Regular users see their feedback history
        router.push('/dashboard/feedback/my-feedback');
        break;
    }
  }, [user, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <FaSpinner className="animate-spin text-4xl text-blue-500" />
    </div>
  );
} 