'use client';

import { User } from '@/services/userService';

interface UserParkingViewProps {
  user: User;
}

export default function UserParkingView({ user }: UserParkingViewProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Available Parking Spots</h1>
      <p className="text-gray-400">User ID: {user.id}</p>
      {/* Add parking spots display logic here */}
    </div>
  );
} 