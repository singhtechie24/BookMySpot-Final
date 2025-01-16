'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { useAuth } from '@/context/AuthContext';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { FaCalendarCheck, FaHistory, FaTimes, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Booking {
  id: string;
  spotId: string;
  spotName: string;
  startTime: { toDate: () => Date };
  endTime: { toDate: () => Date };
  status: string;
  totalAmount: number;
  address?: string;
}

type FilterStatus = 'all' | 'active' | 'completed' | 'cancelled';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    if (!user?.id) return;

    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Sort bookings by start time (most recent first)
      const sortedBookings = bookingsData.sort((a, b) => 
        b.startTime.toDate().getTime() - a.startTime.toDate().getTime()
      );

      setBookings(sortedBookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'completed',
        completedAt: new Date()
      });
      toast.success('Booking marked as completed');
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });
      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'completed':
        return 'text-blue-500 bg-blue-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getBookingStats = () => {
    const now = new Date();
    const active = bookings.filter(b => 
      b.status === 'active' && 
      isAfter(b.endTime.toDate(), now)
    ).length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const total = bookings.length;

    return { active, completed, cancelled, total };
  };

  const filteredBookings = bookings.filter(booking => 
    filterStatus === 'all' ? true : booking.status.toLowerCase() === filterStatus
  );

  const stats = getBookingStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaHistory className="text-blue-500" />
          My Bookings
        </h1>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Bookings</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <FaHistory className="text-blue-500 text-2xl" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            </div>
            <FaClock className="text-green-500 text-2xl" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-blue-500">{stats.completed}</p>
            </div>
            <FaCalendarCheck className="text-blue-500 text-2xl" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
            </div>
            <FaTimes className="text-red-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-700">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => {
              const startDate = booking.startTime.toDate();
              const endDate = booking.endTime.toDate();
              const isUpcoming = isAfter(endDate, new Date());
              
              return (
                <div 
                  key={booking.id} 
                  className={`p-6 hover:bg-gray-700/50 transition-colors ${
                    isUpcoming ? 'border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-white text-lg">{booking.spotName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaMapMarkerAlt />
                        <p>{booking.address || 'Address not available'}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-blue-500" />
                          <div>
                            <p className="text-gray-400 text-sm">Start</p>
                            <p className="text-white">
                              {isToday(startDate) ? 'Today' : format(startDate, 'MMM d, yyyy')}{' '}
                              {format(startDate, 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaClock className="text-green-500" />
                          <div>
                            <p className="text-gray-400 text-sm">End</p>
                            <p className="text-white">
                              {isToday(endDate) ? 'Today' : format(endDate, 'MMM d, yyyy')}{' '}
                              {format(endDate, 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaMoneyBillWave className="text-yellow-500" />
                          <div>
                            <p className="text-gray-400 text-sm">Total</p>
                            <p className="text-white font-medium">£{booking.totalAmount}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {booking.status === 'active' && isUpcoming && (
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleCompleteBooking(booking.id)}
                          className="flex items-center justify-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 md:flex-none"
                        >
                          <FaCalendarCheck className="text-sm" />
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex items-center justify-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1 md:flex-none"
                        >
                          <FaTimes className="text-sm" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <FaHistory className="mx-auto text-5xl text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No bookings found</h3>
              <p className="text-gray-400">
                {filterStatus === 'all' 
                  ? "You haven't made any bookings yet."
                  : `You don't have any ${filterStatus} bookings.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 