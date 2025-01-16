'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { ParkingSpot } from '@/types/parkingSpot';
import Image from 'next/image';
import { FaSpinner, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSearch, FaFilter, FaMapMarkerAlt, FaPoundSign } from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { updateSpotAvailability } from '@/services/parkingSpotService';

type FilterType = 'all' | 'available' | 'unavailable';

interface SpotWithBookings extends ParkingSpot {
  bookings?: Array<{
    totalAmount: number;
  }>;
}

export default function MySpotsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spots, setSpots] = useState<SpotWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSpots = async () => {
      try {
        const spotsRef = collection(db, 'parkingSpots');
        const spotsQuery = query(spotsRef, where('ownerId', '==', user.id));
        const snapshot = await getDocs(spotsQuery);
        
        const spotsData: SpotWithBookings[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            address: data.address || '',
            city: data.city || '',
            pricePerHour: data.pricePerHour || 0,
            availability: data.availability || 'unavailable',
            ownerId: data.ownerId || '',
            days: data.days || [],
            timeSlots: data.timeSlots || [],
            bookings: data.bookings || [],
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        });
        
        setSpots(spotsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching spots:', error);
        setError('Failed to load spots');
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [user, router]);

  const toggleAvailability = async (spotId: string, currentAvailability: string) => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to update spot availability');
        return;
      }

      const spot = spots.find(s => s.id === spotId);
      if (!spot) {
        toast.error('Spot not found');
        return;
      }

      const newAvailability = currentAvailability === 'available' ? 'unavailable' : 'available';
      await updateSpotAvailability(user.id, spotId, newAvailability);
      
      setSpots(prevSpots => 
        prevSpots.map(s => 
          s.id === spotId 
            ? { ...s, availability: newAvailability, updatedAt: new Date() }
            : s
        )
      );
      
      toast.success(`Request to mark "${spot.name}" as ${newAvailability} has been sent to admin for approval`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update spot availability');
    }
  };

  const deleteSpot = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this parking spot?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'parkingSpots', spotId));
      setSpots(prevSpots => prevSpots.filter(spot => spot.id !== spotId));
      toast.success('Spot deleted successfully');
    } catch (error) {
      console.error('Error deleting spot:', error);
      toast.error('Failed to delete spot');
    }
  };

  const getSpotStats = () => {
    return {
      total: spots.length,
      available: spots.filter(s => s.availability === 'available').length,
      unavailable: spots.filter(s => s.availability === 'unavailable').length,
      totalRevenue: spots.reduce((sum, spot) => {
        const revenue = spot.bookings?.reduce((total: number, booking: { totalAmount: number }) => 
          total + (booking.totalAmount || 0), 0) || 0;
        return sum + revenue;
      }, 0)
    };
  };

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = searchTerm === '' || 
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || spot.availability === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <p className="text-gray-400">Loading your parking spots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const stats = getSpotStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Parking Spot Management</h1>
          <p className="text-gray-400 mt-1">Manage and monitor your parking spots</p>
        </div>
        <Link
          href="/dashboard/my-spots/add"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <FaPlus className="text-sm" />
          <span>Add New Spot</span>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Spots</p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FaMapMarkerAlt className="text-xl text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available</p>
              <p className="text-xl font-bold text-white mt-1">{stats.available}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <FaToggleOn className="text-xl text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 rounded-xl border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unavailable</p>
              <p className="text-xl font-bold text-white mt-1">{stats.unavailable}</p>
            </div>
            <div className="bg-red-500/20 p-2 rounded-lg">
              <FaToggleOff className="text-xl text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-xl font-bold text-white mt-1">£{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <FaPoundSign className="text-xl text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by spot name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Spots</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Spots Grid */}
        <div className="mt-6">
          {filteredSpots.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No spots found</h3>
              <p className="text-gray-400">
                {searchTerm || filter !== 'all'
                  ? "No spots match your search criteria"
                  : "You haven't added any parking spots yet"}
              </p>
              {!searchTerm && filter === 'all' && (
                <Link
                  href="/dashboard/my-spots/add"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mt-4"
                >
                  <FaPlus className="text-sm" />
                  <span>Add your first spot</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpots.map((spot) => (
                <div 
                  key={spot.id} 
                  className="bg-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-700/70 transition-colors group"
                >
                  <div className="relative h-48">
                    <Image
                      src={spot.imageUrl}
                      alt={spot.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-semibold text-white truncate">{spot.name}</h3>
                      <p className="text-gray-300 text-sm truncate">{spot.address}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FaPoundSign className="text-yellow-400" />
                        <span className="text-white font-medium">£{spot.pricePerHour}/hour</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        spot.availability === 'available'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {spot.availability}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/my-spots/${spot.id}/edit`)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors hover:bg-blue-400/10 rounded-lg"
                          title="Edit spot"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteSpot(spot.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-400/10 rounded-lg"
                          title="Delete spot"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleAvailability(spot.id, spot.availability)}
                        className={`p-2 transition-colors rounded-lg ${
                          spot.availability === 'available'
                            ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-400/10'
                        }`}
                        title="Toggle availability"
                      >
                        {spot.availability === 'available' ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                      </button>
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