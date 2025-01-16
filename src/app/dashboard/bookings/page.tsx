'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types/booking';
import { subscribeToOwnerBookings } from '@/services/bookingService';
import { FaFilter, FaSearch, FaCalendarCheck, FaMoneyBillWave, FaUserAlt, FaClock, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { format, isAfter } from 'date-fns';

type FilterStatus = 'all' | 'active' | 'upcoming' | 'expired' | 'cancelled';
type PaymentStatus = 'all' | 'completed' | 'pending' | 'failed';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  
  // If it's a Firestore Timestamp
  if (date && typeof date.toDate === 'function') {
    return format(date.toDate(), 'MMM d, h:mm a');
  }
  
  // If it's already a Date object
  if (date instanceof Date) {
    return format(date, 'MMM d, h:mm a');
  }
  
  // If it's a timestamp number
  if (typeof date === 'number') {
    return format(new Date(date), 'MMM d, h:mm a');
  }
  
  return 'Invalid date';
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    const unsubscribe = subscribeToOwnerBookings(user.id, (updatedBookings) => {
      setBookings(updatedBookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, router]);

  const getBookingStats = () => {
    const now = new Date();
    return {
      total: bookings.length,
      active: bookings.filter(b => b.bookingStatus === 'active').length,
      upcoming: bookings.filter(b => b.bookingStatus === 'upcoming').length,
      completed: bookings.filter(b => b.bookingStatus === 'expired').length,
      cancelled: bookings.filter(b => b.bookingStatus === 'cancelled').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.bookingStatus === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    const matchesSearch = searchTerm === '' || 
      booking.spotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const stats = getBookingStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <p className="text-gray-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Booking Management</h1>
          <p className="text-gray-400 mt-1">Track and manage your parking spot bookings</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bookings</p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FaCalendarCheck className="text-xl text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-xl font-bold text-white mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <FaClock className="text-xl text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Upcoming</p>
              <p className="text-xl font-bold text-white mt-1">{stats.upcoming}</p>
            </div>
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <FaCalendarCheck className="text-xl text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-xl font-bold text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <FaCalendarCheck className="text-xl text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 rounded-xl border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Cancelled</p>
              <p className="text-xl font-bold text-white mt-1">{stats.cancelled}</p>
            </div>
            <div className="bg-red-500/20 p-2 rounded-lg">
              <FaCalendarCheck className="text-xl text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-4 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-xl font-bold text-white mt-1">£{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <FaMoneyBillWave className="text-xl text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by spot or user name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-gray-400" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus)}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Payments</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="mt-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaCalendarCheck className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No bookings found</h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? "No bookings match your search criteria" 
                  : statusFilter === 'all' 
                    ? "You don't have any bookings yet"
                    : `No ${statusFilter} bookings found`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className={`bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors ${
                    booking.bookingStatus === 'active' ? 'border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-white">{booking.spotName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          booking.bookingStatus === 'active'
                            ? 'bg-green-500/10 text-green-400'
                            : booking.bookingStatus === 'upcoming'
                            ? 'bg-blue-500/10 text-blue-400'
                            : booking.bookingStatus === 'expired'
                            ? 'bg-gray-500/10 text-gray-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <FaUserAlt className="text-sm" />
                        <span>{booking.userName}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-blue-400" />
                          <div>
                            <p className="text-xs text-gray-400">Start Time</p>
                            <p className="text-sm text-white">
                              {formatDate(booking.startTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaClock className="text-green-400" />
                          <div>
                            <p className="text-xs text-gray-400">End Time</p>
                            <p className="text-sm text-white">
                              {formatDate(booking.endTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <FaMoneyBillWave className="text-yellow-400" />
                          <div>
                            <p className="text-xs text-gray-400">Amount</p>
                            <p className="text-sm text-white">£{(booking.totalAmount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.paymentStatus === 'completed'
                          ? 'bg-green-500/10 text-green-400'
                          : booking.paymentStatus === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 