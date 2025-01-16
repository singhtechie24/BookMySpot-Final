'use client';

import { useState, useEffect } from 'react';
import { User } from '@/services/userService';
import { ParkingSpot } from '@/types/parkingSpot';
import { subscribeToAllParkingSpots } from '@/services/parkingSpotService';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaParking, FaChartBar } from 'react-icons/fa';
import AdminParkingSpotCard from './AdminParkingSpotCard';
import { format } from 'date-fns';

interface AdminParkingSpotManagementProps {
  user: User;
}

type FilterType = 'all' | 'available' | 'unavailable' | 'pending';

export default function AdminParkingSpotManagement({ user }: AdminParkingSpotManagementProps) {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'bookings'>('newest');

  useEffect(() => {
    if (!user?.id || user.role !== 'admin') {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAllParkingSpots((newSpots) => {
      setSpots(newSpots);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, user.role]);

  const getSpotStats = () => {
    return {
      total: spots.length,
      available: spots.filter(spot => spot.availability === 'available').length,
      unavailable: spots.filter(spot => spot.availability === 'unavailable').length,
      pending: spots.filter(spot => spot.status === 'pending').length,
      totalRevenue: spots.reduce((total, spot) => total + (spot.totalRevenue || 0), 0)
    };
  };

  const sortSpots = (spotsToSort: ParkingSpot[]) => {
    switch (sortBy) {
      case 'newest':
        return [...spotsToSort].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 'price':
        return [...spotsToSort].sort((a, b) => (b.pricePerHour || 0) - (a.pricePerHour || 0));
      case 'bookings':
        return [...spotsToSort].sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
      default:
        return spotsToSort;
    }
  };

  const filteredSpots = sortSpots(spots.filter(spot => {
    const matchesSearch = 
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.city?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && spot.status === 'pending';
    return matchesSearch && spot.availability === filter;
  }));

  const stats = getSpotStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Spots</p>
              <h3 className="text-xl font-bold text-white mt-1">{stats.total}</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FaParking className="text-blue-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available</p>
              <h3 className="text-xl font-bold text-white mt-1">{stats.available}</h3>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FaMapMarkerAlt className="text-green-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 rounded-xl border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unavailable</p>
              <h3 className="text-xl font-bold text-white mt-1">{stats.unavailable}</h3>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <FaParking className="text-red-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <h3 className="text-xl font-bold text-white mt-1">{stats.pending}</h3>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <FaFilter className="text-yellow-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <h3 className="text-xl font-bold text-white mt-1">£{stats.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <FaChartBar className="text-purple-400 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search parking spots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price' | 'bookings')}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="price">Highest Price</option>
              <option value="bookings">Most Bookings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpots.map((spot) => (
          <AdminParkingSpotCard
            key={spot.id}
            spot={spot}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredSpots.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FaParking className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No parking spots found</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? "No parking spots available at the moment"
              : `No ${filter} parking spots found`}
          </p>
        </div>
      )}
    </div>
  );
} 