'use client';

import { useState, useEffect } from 'react';
import { User } from '@/services/userService';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  Filler
} from 'chart.js';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SpaceOwnerRevenueChartProps {
  user: User;
}

interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
  averagePerBooking: number;
}

export default function SpaceOwnerRevenueChart({ user }: SpaceOwnerRevenueChartProps) {
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'revenue' | 'bookings'>('revenue');

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!user?.id) return;

      try {
        // Get all spots owned by the user
        const spotsRef = collection(db, 'parkingSpots');
        const spotsQuery = query(spotsRef, where('ownerId', '==', user.id));
        const spotsSnapshot = await getDocs(spotsQuery);
        const spotIds = spotsSnapshot.docs.map(doc => doc.id);

        // Get last 6 months data
        const monthlyData: RevenueData[] = [];
        
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);
          const monthKey = format(date, 'MMM yyyy');

          if (spotIds.length > 0) {
            const bookingsRef = collection(db, 'bookings');
            const bookingsQuery = query(
              bookingsRef,
              where('ownerId', '==', user.id),
              where('status', '==', 'completed'),
              where('endTime', '>=', Timestamp.fromDate(monthStart)),
              where('endTime', '<=', Timestamp.fromDate(monthEnd))
            );

            const snapshot = await getDocs(bookingsQuery);
            const bookings = snapshot.docs.map(doc => doc.data());
            const revenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
            
            monthlyData.push({
              month: monthKey,
              revenue,
              bookings: bookings.length,
              averagePerBooking: bookings.length > 0 ? revenue / bookings.length : 0
            });
          } else {
            monthlyData.push({
              month: monthKey,
              revenue: 0,
              bookings: 0,
              averagePerBooking: 0
            });
          }
        }

        setRevenueData(monthlyData);
        updateChartData(monthlyData, selectedView);
        setError(null);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [user?.id]);

  const updateChartData = (data: RevenueData[], view: 'revenue' | 'bookings') => {
    const months = data.map(item => item.month);
    
    if (view === 'revenue') {
      setChartData({
        labels: months,
        datasets: [
          {
            label: 'Revenue',
            data: data.map(item => item.revenue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Average per Booking',
            data: data.map(item => item.averagePerBooking),
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
            borderDash: [5, 5]
          }
        ]
      });
    } else {
      setChartData({
        labels: months,
        datasets: [
          {
            label: 'Bookings',
            data: data.map(item => item.bookings),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      });
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'white',
        bodyColor: 'rgb(156, 163, 175)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        padding: 12,
        bodySpacing: 8,
        titleSpacing: 8,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += selectedView === 'revenue' ? `£${context.parsed.y.toFixed(2)}` : context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'white',
          callback: function(value: number) {
            return selectedView === 'revenue' ? `£${value}` : value;
          },
          padding: 10
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'white',
          padding: 10
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
      }
    }
  };

  const getRevenueChange = () => {
    if (revenueData.length < 2) return 0;
    const currentRevenue = revenueData[revenueData.length - 1].revenue;
    const previousRevenue = revenueData[revenueData.length - 2].revenue;
    return previousRevenue === 0 ? 100 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[400px] text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  const revenueChange = getRevenueChange();
  const currentMonthData = revenueData[revenueData.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Revenue Overview</h3>
            <p className="text-sm text-gray-400 mt-1">Last 6 months performance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedView('revenue');
                updateChartData(revenueData, 'revenue');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedView === 'revenue'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => {
                setSelectedView('bookings');
                updateChartData(revenueData, 'bookings');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedView === 'bookings'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Bookings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Current Month</p>
              <div className={`flex items-center gap-1 text-sm ${
                revenueChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {revenueChange >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(revenueChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              £{currentMonthData?.revenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-750 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Bookings</p>
            <p className="text-2xl font-bold text-white mt-2">
              {currentMonthData?.bookings}
            </p>
          </div>
          <div className="bg-gray-750 rounded-lg p-4">
            <p className="text-sm text-gray-400">Average per Booking</p>
            <p className="text-2xl font-bold text-white mt-2">
              £{currentMonthData?.averagePerBooking.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
} 