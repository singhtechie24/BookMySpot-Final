'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';
import { FaHistory, FaMapMarkerAlt, FaClock, FaMoneyBillWave } from 'react-icons/fa';

interface BookingHistory {
  id: string;
  spotName: string;
  spotAddress: string;
  startTime: { toDate: () => Date };
  endTime: { toDate: () => Date };
  status: string;
  totalAmount: number;
  paymentStatus: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const bookingsRef = collection(db, 'bookings');
    const historyQuery = query(
      bookingsRef,
      where('userId', '==', user.id),
      where('status', 'in', ['completed', 'cancelled']),
      orderBy('startTime', 'desc')
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingHistory[];

      // Calculate spending
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthly = bookings.reduce((sum, booking) => {
        const bookingDate = booking.startTime.toDate();
        if (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear &&
          booking.status === 'completed'
        ) {
          return sum + booking.totalAmount;
        }
        return sum;
      }, 0);

      const total = bookings.reduce((sum, booking) => {
        if (booking.status === 'completed') {
          return sum + booking.totalAmount;
        }
        return sum;
      }, 0);

      setMonthlySpending(monthly);
      setTotalSpending(total);
      setHistory(bookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaHistory className="text-purple-500" />
          Booking History
        </h1>
      </div>

      {/* Spending Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Monthly Spending</p>
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-400">Monthly Spending:</span>
                <span className="text-white">£{monthlySpending.toFixed(2)}</span>
              </div>
            </div>
            <FaMoneyBillWave className="text-3xl text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Spending</p>
              <div className="flex justify-between items-center text-lg font-semibold mt-4">
                <span className="text-gray-400">Total Spending:</span>
                <span className="text-white">£{totalSpending.toFixed(2)}</span>
              </div>
            </div>
            <FaMoneyBillWave className="text-3xl text-blue-500" />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {history.length > 0 ? (
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-700">
              <tr>
                <th scope="col" className="py-3 px-6 text-white">
                  Spot Name
                </th>
                <th scope="col" className="py-3 px-6 text-white">
                  Start Time
                </th>
                <th scope="col" className="py-3 px-6 text-white">
                  End Time
                </th>
                <th scope="col" className="py-3 px-6 text-white">
                  Amount
                </th>
                <th scope="col" className="py-3 px-6 text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-700">
                  <td className="py-4 text-white">{booking.spotName}</td>
                  <td className="py-4 text-white">{format(booking.startTime.toDate(), 'PPp')}</td>
                  <td className="py-4 text-white">{format(booking.endTime.toDate(), 'PPp')}</td>
                  <td className="py-4 text-white">£{booking.totalAmount.toFixed(2)}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === 'completed'
                        ? 'bg-green-500/10 text-green-400'
                        : booking.status === 'cancelled'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <FaHistory className="mx-auto text-4xl text-gray-600 mb-4" />
            <p className="text-gray-400">No booking history found</p>
          </div>
        )}
      </div>
    </div>
  );
} 