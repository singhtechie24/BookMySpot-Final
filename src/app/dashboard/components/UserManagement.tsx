'use client';

import { useState, useEffect } from 'react';
import { FaTrash, FaParking, FaUser } from 'react-icons/fa';
import { User } from '@/services/userService';
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface UserManagementProps {
  user: User;
}

interface ExtendedUser extends User {
  totalEarnings?: number;
  totalSpending?: number;
  totalSpots?: number;
  totalBookings?: number;
  paymentStatus?: 'paid' | 'pending' | 'failed';
}

export default function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'space_owners' | 'drivers'>('all');
  const [processingDelete, setProcessingDelete] = useState<string | null>(null);
  const db = getFirestore();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      let q = query(usersRef, orderBy('createdAt', 'desc'));
      
      if (activeTab === 'space_owners') {
        q = query(usersRef, where('role', '==', 'space_owner'), orderBy('createdAt', 'desc'));
      } else if (activeTab === 'drivers') {
        q = query(usersRef, where('role', '==', 'user'), orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const usersData: ExtendedUser[] = [];

      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        
        // Calculate earnings for space owners
        let totalEarnings = 0;
        if (userData.role === 'space_owner') {
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(bookingsRef, where('ownerId', '==', userDoc.id));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          totalEarnings = bookingsSnapshot.docs.reduce((sum, doc) => sum + doc.data().price, 0);
        }

        // Calculate spending for drivers
        let totalSpending = 0;
        if (userData.role === 'user') {
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(bookingsRef, where('userId', '==', userDoc.id));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          totalSpending = bookingsSnapshot.docs.reduce((sum, doc) => sum + doc.data().price, 0);
        }

        // Get total parking spots for space owners
        let totalSpots = 0;
        if (userData.role === 'space-owner') {
          const spotsRef = collection(db, 'parkingSpots');
          const spotsQuery = query(spotsRef, where('createdBy', '==', userDoc.id));
          const spotsSnapshot = await getDocs(spotsQuery);
          totalSpots = spotsSnapshot.size;
        }

        // Get total bookings for drivers
        let totalBookings = 0;
        if (userData.role === 'user') {
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(bookingsRef, where('userId', '==', userDoc.id));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          totalBookings = bookingsSnapshot.size;
        }

        usersData.push({
          id: userDoc.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          type: userData.type,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          totalEarnings,
          totalSpending,
          totalSpots,
          totalBookings,
          paymentStatus: userData.paymentStatus || 'paid'
        });
      }

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleDeleteUser = async (userId: string) => {
    try {
      setProcessingDelete(userId);
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setProcessingDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveTab('space_owners')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'space_owners'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Space Owners
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'drivers'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Drivers
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-6 py-3 text-gray-400">#</th>
              <th className="px-6 py-3 text-gray-400">Email</th>
              <th className="px-6 py-3 text-gray-400">Role</th>
              <th className="px-6 py-3 text-gray-400">
                {activeTab === 'space_owners' ? 'Total Earnings' : 'Total Spending'}
              </th>
              <th className="px-6 py-3 text-gray-400">
                {activeTab === 'space_owners' ? 'Total Spots' : 'Total Bookings'}
              </th>
              <th className="px-6 py-3 text-gray-400">Payment Status</th>
              <th className="px-6 py-3 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-6 py-4 text-gray-300">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                      {user.role === 'space_owner' ? (
                        <FaParking className="text-blue-400" />
                      ) : (
                        <FaUser className="text-green-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white">{user.email}</div>
                      <div className="text-gray-400 text-sm">Created {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'space_owner'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    {user.role === 'space_owner' ? 'Space Owner' : 'Driver'}
                  </span>
                </td>
                <td className="px-6 py-4 text-white">
                  ${user.role === 'space_owner' 
                    ? user.totalEarnings?.toFixed(2) 
                    : user.totalSpending?.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-white">
                  {user.role === 'space_owner' ? user.totalSpots : user.totalBookings}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.paymentStatus === 'paid'
                      ? 'bg-green-500/10 text-green-400'
                      : user.paymentStatus === 'pending'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {user.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={processingDelete === user.id}
                    className={`text-red-400 hover:text-red-500 ${
                      processingDelete === user.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 