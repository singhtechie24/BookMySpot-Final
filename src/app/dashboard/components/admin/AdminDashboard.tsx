'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { User } from '@/services/userService';
import { FaUsers, FaParking, FaCalendarCheck, FaClipboardList, FaChartLine, FaMoneyBillWave, FaExclamationTriangle, FaUserClock } from 'react-icons/fa';
import AdminRevenueChart from './AdminRevenueChart';
import AdminNotificationCenter from './AdminNotificationCenter';
import { format } from 'date-fns';

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSpots: 0,
    activeBookings: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    pendingApprovals: 0,
    urgentIssues: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to users count and new users today
    const usersRef = collection(db, 'users');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const unsubscribeUsers = onSnapshot(
      query(usersRef),
      (snapshot) => {
        const total = snapshot.size;
        const newToday = snapshot.docs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          return createdAt && createdAt >= today;
        }).length;
        setStats(prev => ({ ...prev, totalUsers: total, newUsersToday: newToday }));
      }
    );

    // Subscribe to parking spots count and pending approvals
    const spotsRef = collection(db, 'parkingSpots');
    const unsubscribeSpots = onSnapshot(
      query(spotsRef),
      (snapshot) => {
        const total = snapshot.size;
        const pending = snapshot.docs.filter(doc => doc.data().status === 'pending').length;
        setStats(prev => ({ ...prev, totalSpots: total, pendingApprovals: pending }));
      }
    );

    // Subscribe to active bookings and total revenue
    const bookingsRef = collection(db, 'bookings');
    const unsubscribeBookings = onSnapshot(
      query(bookingsRef),
      (snapshot) => {
        const active = snapshot.docs.filter(doc => doc.data().status === 'active').length;
        const revenue = snapshot.docs.reduce((total, doc) => {
          const data = doc.data();
          return total + (data.status === 'completed' ? data.totalAmount || 0 : 0);
        }, 0);
        setStats(prev => ({ ...prev, activeBookings: active, totalRevenue: revenue }));
      }
    );

    // Subscribe to urgent issues (feedback + support requests)
    const feedbackRef = collection(db, 'feedback');
    const unsubscribeFeedback = onSnapshot(
      query(feedbackRef, where('priority', '==', 'urgent'), where('status', '==', 'pending')),
      (snapshot) => {
        setStats(prev => ({ ...prev, urgentIssues: snapshot.size }));
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeSpots();
      unsubscribeBookings();
      unsubscribeFeedback();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-[2000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of your platform's performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 md:p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm md:text-base">Total Users</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-2">{stats.totalUsers}</h3>
              <p className="text-blue-400 text-sm mt-1">+{stats.newUsersToday} today</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FaUsers className="text-blue-400 text-xl md:text-2xl" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 md:p-6 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm md:text-base">Total Revenue</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-2">£{stats.totalRevenue.toFixed(2)}</h3>
              <p className="text-green-400 text-sm mt-1">{stats.activeBookings} active bookings</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FaMoneyBillWave className="text-green-400 text-xl md:text-2xl" />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 md:p-6 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm md:text-base">Pending Approvals</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-2">{stats.pendingApprovals}</h3>
              <p className="text-yellow-400 text-sm mt-1">{stats.totalSpots} total spots</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <FaUserClock className="text-yellow-400 text-xl md:text-2xl" />
            </div>
          </div>
        </div>

        {/* Urgent Issues */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 md:p-6 rounded-xl border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm md:text-base">Urgent Issues</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-2">{stats.urgentIssues}</h3>
              <p className="text-red-400 text-sm mt-1">Requires attention</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <FaExclamationTriangle className="text-red-400 text-xl md:text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-800/50 p-4 md:p-6 rounded-xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-white">Revenue Overview</h2>
            <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm">
              {format(new Date(), 'MMM yyyy')}
            </div>
          </div>
          <div className="h-[350px] md:h-[400px]">
            <AdminRevenueChart user={user} />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800/50 p-4 md:p-6 rounded-xl border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-white">Recent Notifications</h2>
            <div className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm">
              Real-time updates
            </div>
          </div>
          <div className="h-[350px] md:h-[400px] overflow-y-auto">
            <AdminNotificationCenter user={user} />
          </div>
        </div>
      </div>
    </div>
  );
} 