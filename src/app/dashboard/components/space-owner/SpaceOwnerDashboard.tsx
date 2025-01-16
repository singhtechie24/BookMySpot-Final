'use client';

import { useState, useEffect } from 'react';
import { User } from '@/services/userService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import SpaceOwnerRevenueChart from './SpaceOwnerRevenueChart';
import SpaceOwnerNotificationCenter from './SpaceOwnerNotificationCenter';
import { FaParking, FaCalendarCheck, FaMoneyBillWave, FaPlus } from 'react-icons/fa';
import { getRevenueOverview } from '@/services/revenueService';
import Link from 'next/link';

interface SpaceOwnerDashboardProps {
  user: User;
}

export default function SpaceOwnerDashboard({ user }: SpaceOwnerDashboardProps) {
  const [stats, setStats] = useState({
    totalSpots: 0,
    activeBookings: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch spots
        const spotsRef = collection(db, 'parkingSpots');
        const spotsQuery = query(spotsRef, where('ownerId', '==', user.id));
        const spotsSnapshot = await getDocs(spotsQuery);
        const spots = spotsSnapshot.docs;
        
        setStats(prev => ({ ...prev, totalSpots: spots.length }));

        // If user has spots, fetch bookings and revenue
        if (spots.length > 0) {
          const spotIds = spots.map(doc => doc.id);
          
          // Fetch active bookings
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(
            bookingsRef,
            where('spotId', 'in', spotIds),
            where('status', '==', 'active')
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          setStats(prev => ({ ...prev, activeBookings: bookingsSnapshot.size }));

          // Fetch revenue overview
          const revenueData = await getRevenueOverview(user.id);
          setStats(prev => ({ ...prev, monthlyRevenue: revenueData.monthlyRevenue }));
        }

        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome back, {user.name || 'Space Owner'}</h1>
          <p className="text-gray-400 mt-1">Here's what's happening with your parking spots</p>
        </div>
        <Link
          href="/dashboard/my-spots/add"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <FaPlus className="text-sm" /> Add New Spot
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 md:p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Spots</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">{stats.totalSpots}</p>
              <div className="flex items-center gap-2 mt-1">
                <Link href="/dashboard/my-spots" className="text-sm text-blue-400 hover:text-blue-300">
                  View all spots →
                </Link>
              </div>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FaParking className="text-xl md:text-2xl text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 md:p-6 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Bookings</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">{stats.activeBookings}</p>
              <div className="flex items-center gap-2 mt-1">
                <Link href="/dashboard/bookings" className="text-sm text-green-400 hover:text-green-300">
                  Manage bookings →
                </Link>
              </div>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FaCalendarCheck className="text-xl md:text-2xl text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 md:p-6 rounded-xl border border-yellow-500/20 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Monthly Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">£{stats.monthlyRevenue}</p>
              <div className="flex items-center gap-2 mt-1">
                <Link href="/dashboard/analytics" className="text-sm text-yellow-400 hover:text-yellow-300">
                  View analytics →
                </Link>
              </div>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <FaMoneyBillWave className="text-xl md:text-2xl text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <SpaceOwnerRevenueChart user={user} />
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-white">Recent Notifications</h3>
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
          <div className="h-[350px] md:h-[400px] overflow-y-auto">
            <SpaceOwnerNotificationCenter user={user} />
          </div>
        </div>
      </div>
    </div>
  );
} 