'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  Filler
} from 'chart.js';
import { FaSpinner, FaChartLine, FaParking, FaCalendarCheck, FaMoneyBillWave, FaTrophy, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { format, startOfMonth, subMonths } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  activeSpots: number;
  occupancyRate: number;
  revenueByMonth: { [key: string]: number };
  bookingsByMonth: { [key: string]: number };
  popularSpots: Array<{ name: string; bookings: number }>;
}

interface Booking {
  id: string;
  spotId: string;
  startTime: { toDate: () => Date };
  endTime: { toDate: () => Date };
  totalAmount: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('6m');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalBookings: 0,
    totalRevenue: 0,
    activeSpots: 0,
    occupancyRate: 0,
    revenueByMonth: {},
    bookingsByMonth: {},
    popularSpots: []
  });
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Calculate trends
  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0;
    const lastMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    return ((lastMonth - previousMonth) / previousMonth) * 100;
  };

  const revenueTrend = calculateTrend(Object.values(analyticsData.revenueByMonth));
  const bookingsTrend = calculateTrend(Object.values(analyticsData.bookingsByMonth));

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        // Get all spots owned by the user
        const spotsRef = collection(db, 'parkingSpots');
        const spotsQuery = query(spotsRef, where('ownerId', '==', user.id));
        const spotsSnapshot = await getDocs(spotsQuery);
        const spots = spotsSnapshot.docs;
        const spotIds = spots.map(doc => doc.id);
        const spotNames = new Map(spots.map(doc => [doc.id, doc.data().name]));

        if (spotIds.length === 0) {
          setAnalyticsData({
            totalBookings: 0,
            totalRevenue: 0,
            activeSpots: 0,
            occupancyRate: 0,
            revenueByMonth: {},
            bookingsByMonth: {},
            popularSpots: []
          });
          setLoading(false);
          return;
        }

        // Get last 6 months of bookings
        const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5);
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(
          bookingsRef,
          where('spotId', 'in', spotIds),
          where('startTime', '>=', Timestamp.fromDate(sixMonthsAgo))
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Booking));

        // Calculate monthly data
        const revenueByMonth: { [key: string]: number } = {};
        const bookingsByMonth: { [key: string]: number } = {};
        const spotBookings: { [key: string]: number } = {};

        bookings.forEach(booking => {
          const month = format(booking.startTime.toDate(), 'MMM yyyy');
          revenueByMonth[month] = (revenueByMonth[month] || 0) + (booking.totalAmount || 0);
          bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
          spotBookings[booking.spotId] = (spotBookings[booking.spotId] || 0) + 1;
        });

        // Calculate popular spots
        const popularSpots = Object.entries(spotBookings)
          .map(([spotId, count]) => ({
            name: spotNames.get(spotId) || 'Unknown Spot',
            bookings: count
          }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 5);

        // Calculate occupancy rate
        const totalPossibleBookingDays = spots.length * 180; // 6 months * 30 days
        const totalBookedDays = bookings.reduce((total, booking) => {
          const days = Math.ceil(
            (booking.endTime.toDate().getTime() - booking.startTime.toDate().getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return total + days;
        }, 0);
        const occupancyRate = (totalBookedDays / totalPossibleBookingDays) * 100;

        setAnalyticsData({
          totalBookings: bookings.length,
          totalRevenue: Object.values(revenueByMonth).reduce((a, b) => a + b, 0),
          activeSpots: spots.filter(doc => doc.data().isAvailable).length,
          occupancyRate,
          revenueByMonth,
          bookingsByMonth,
          popularSpots
        });

        setError(null);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, router, selectedTimeRange]);

  const revenueChartData: ChartData<'line'> = {
    labels: Object.keys(analyticsData.revenueByMonth),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: Object.values(analyticsData.revenueByMonth),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ]
  };

  const bookingsChartData: ChartData<'bar'> = {
    labels: Object.keys(analyticsData.bookingsByMonth),
    datasets: [
      {
        label: 'Monthly Bookings',
        data: Object.values(analyticsData.bookingsByMonth),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
          return gradient;
        },
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 0,
        borderRadius: 8,
        hoverBackgroundColor: 'rgb(16, 185, 129)',
        maxBarThickness: 40
      }
    ]
  };

  // Create data for the occupancy doughnut chart
  const occupancyChartData: ChartData<'doughnut'> = {
    labels: ['Occupied', 'Available'],
    datasets: [
      {
        data: [analyticsData.occupancyRate, 100 - analyticsData.occupancyRate],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(107, 114, 128, 0.2)'
        ],
        borderColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(107, 114, 128, 0.2)'
        ],
        borderWidth: 1,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
            weight: '500' as const
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(243, 244, 246)',
        padding: 12,
        borderColor: 'rgb(55, 65, 81)',
        borderWidth: 1,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.dataset.label.includes('Revenue') 
                ? `£${context.parsed.y.toFixed(2)}`
                : context.parsed.y;
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
          color: 'rgba(75, 85, 99, 0.1)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
            weight: '500' as const
          },
          padding: 8,
          callback: function(value: any) {
            return this.chart.data.datasets[0].label?.includes('Revenue')
              ? `£${value}`
              : value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
            weight: '500' as const
          },
          padding: 8
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
            weight: '500' as const
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(243, 244, 246)',
        padding: 12,
        borderColor: 'rgb(55, 65, 81)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Overview</h1>
          <p className="text-gray-400 mt-1">Track your parking business performance</p>
        </div>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1m">Last Month</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 md:p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bookings</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">{analyticsData.totalBookings}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm ${bookingsTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {bookingsTrend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  {Math.abs(bookingsTrend).toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm">vs last month</span>
              </div>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FaCalendarCheck className="text-2xl md:text-3xl text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 md:p-6 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">£{analyticsData.totalRevenue}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm ${revenueTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {revenueTrend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  {Math.abs(revenueTrend).toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm">vs last month</span>
              </div>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FaMoneyBillWave className="text-2xl md:text-3xl text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 md:p-6 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Spots</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">{analyticsData.activeSpots}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-gray-500 text-sm">Total parking spots</span>
              </div>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <FaParking className="text-2xl md:text-3xl text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4 md:p-6 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Occupancy Rate</p>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">{analyticsData.occupancyRate.toFixed(1)}%</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-gray-500 text-sm">Average utilization</span>
              </div>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FaChartLine className="text-2xl md:text-3xl text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white">Revenue & Booking Trends</h3>
                <p className="text-sm text-gray-400 mt-1">Combined performance overview</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-400">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-400">Bookings</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      chartType === 'line'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      chartType === 'bar'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bar
                  </button>
                </div>
                <div className="text-sm text-gray-400">Last {selectedTimeRange}</div>
              </div>
            </div>
            <div className="h-[400px] md:h-[500px] relative">
              {chartType === 'line' ? (
                <Line 
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(75, 85, 99, 0.1)',
                          drawBorder: false,
                        },
                        ticks: {
                          color: 'rgb(156, 163, 175)',
                          font: {
                            size: 11,
                            weight: '500'
                          },
                          padding: 8,
                          callback: function(value: any) {
                            return `£${value}`;
                          }
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: {
                          color: 'rgb(156, 163, 175)',
                          font: {
                            size: 11,
                            weight: '500'
                          },
                          padding: 8
                        }
                      }
                    }
                  }} 
                  data={{
                    labels: Object.keys(analyticsData.revenueByMonth),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: Object.values(analyticsData.revenueByMonth),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                          return gradient;
                        },
                        yAxisID: 'y',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 3
                      },
                      {
                        label: 'Bookings',
                        data: Object.values(analyticsData.bookingsByMonth),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                          return gradient;
                        },
                        yAxisID: 'y1',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgb(16, 185, 129)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 3
                      }
                    ]
                  }}
                />
              ) : (
                <Bar
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(75, 85, 99, 0.1)',
                          drawBorder: false,
                        },
                        ticks: {
                          color: 'rgb(156, 163, 175)',
                          font: {
                            size: 11,
                            weight: '500'
                          },
                          padding: 8,
                          callback: function(value: any) {
                            return `£${value}`;
                          }
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: {
                          color: 'rgb(156, 163, 175)',
                          font: {
                            size: 11,
                            weight: '500'
                          },
                          padding: 8
                        }
                      }
                    }
                  }}
                  data={{
                    labels: Object.keys(analyticsData.revenueByMonth),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: Object.values(analyticsData.revenueByMonth),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y',
                        maxBarThickness: 40
                      },
                      {
                        label: 'Bookings',
                        data: Object.values(analyticsData.bookingsByMonth),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y1',
                        maxBarThickness: 40
                      }
                    ]
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-white">Occupancy Rate</h3>
              <div className="text-sm text-gray-400">Current</div>
            </div>
            <div className="h-[300px] relative">
              <Doughnut options={doughnutOptions} data={occupancyChartData} />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-3xl font-bold text-white">{analyticsData.occupancyRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-400">Occupancy</p>
              </div>
            </div>
          </div>

          {/* Popular Spots */}
          <div className="bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-white">Top Spots</h3>
              <div className="text-sm text-gray-400">By bookings</div>
            </div>
            <div className="space-y-4">
              {analyticsData.popularSpots.map((spot, index) => (
                <div key={spot.name} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-600/20 text-gray-400'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white truncate">{spot.name}</h4>
                        <p className="text-xs text-gray-400">{spot.bookings} bookings</p>
                      </div>
                    </div>
                    <FaTrophy className={`
                      ${index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-gray-400'}
                    `} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 