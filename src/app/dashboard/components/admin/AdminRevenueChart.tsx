'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { User } from '@/services/userService';
import { toast } from 'react-hot-toast';
import { calculateAndStoreRevenue } from '@/services/revenueService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AdminRevenueChartProps {
  user: User;
}

export default function AdminRevenueChart({ user }: AdminRevenueChartProps) {
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchRevenueData = async () => {
    if (!user?.id) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.data();
      
      console.log('User role:', userData?.role);
      
      if (!userData || userData.role !== 'admin') {
        toast.error('Insufficient permissions to view revenue data');
        setLoading(false);
        return;
      }

      console.log('Attempting to fetch revenue data...');

      const revenueRef = collection(db, 'revenue');
      const revenueQuery = query(
        revenueRef,
        orderBy('date', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(revenueQuery);
      console.log('Revenue data fetched:', snapshot.size, 'documents');

      const data = snapshot.docs.map(doc => ({
        date: doc.data().date.toDate(),
        totalRevenue: doc.data().totalRevenue,
        platformFees: doc.data().platformFees
      }));

      data.sort((a, b) => a.date.getTime() - b.date.getTime());

      setChartData({
        labels: data.map(item => item.date.toLocaleDateString()),
        datasets: [
          {
            label: 'Total Revenue',
            data: data.map(item => item.totalRevenue),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          },
          {
            label: 'Platform Fees',
            data: data.map(item => item.platformFees),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [user?.id]);

  const handleUpdateRevenue = async () => {
    try {
      setUpdating(true);
      const result = await calculateAndStoreRevenue();
      toast.success(`Revenue updated: £${result.totalRevenue.toFixed(2)}`);
      await fetchRevenueData(); // Refresh the chart
    } catch (error) {
      console.error('Error updating revenue:', error);
      toast.error('Failed to update revenue data');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Platform Revenue Overview',
        color: 'white'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          callback: function(value) {
            return `£${value}`;
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleUpdateRevenue}
          disabled={updating}
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
            updating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {updating ? 'Updating...' : 'Update Revenue Data'}
        </button>
      </div>
      <div className="w-full h-[400px]">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
} 