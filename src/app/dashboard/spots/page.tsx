'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { AddSpotModal } from './components/AddSpotModal';
import EditSpotModal from './components/EditSpotModal';
import { ParkingSpot } from '@/types/parkingSpot';
import { 
  getParkingSpotsByOwner, 
  getAllParkingSpots,
  deleteParkingSpot, 
  updateSpotAvailability 
} from '@/services/parkingSpotService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function SpotList() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const fetchSpots = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      let fetchedSpots;
      if (user.role === 'admin') {
        fetchedSpots = await getAllParkingSpots(user.id);
      } else if (user.role === 'space-owner') {
        fetchedSpots = await getParkingSpotsByOwner(user.id);
      } else {
        throw new Error('Unauthorized: Invalid user role');
      }
      setSpots(fetchedSpots);
    } catch (error) {
      console.error('Error fetching spots:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch parking spots');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, router]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const handleEditClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setIsEditModalOpen(true);
  };

  const handleSpotUpdated = () => {
    fetchSpots();
    setIsEditModalOpen(false);
    setSelectedSpot(null);
  };

  const handleSpotAdded = () => {
    fetchSpots();
    setIsAddModalOpen(false);
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to delete a spot');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this parking spot? This action cannot be undone.')) {
      try {
        await deleteParkingSpot(user.id, spotId);
        toast.success('Parking spot deleted successfully');
        fetchSpots();
      } catch (error) {
        console.error('Error deleting spot:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to delete parking spot');
        }
      }
    }
  };

  const handleAvailabilityChange = async (spotId: string, newAvailability: 'available' | 'unavailable') => {
    if (!user?.id) return;
    
    try {
      await updateSpotAvailability(user.id, spotId, newAvailability);
      toast.success(`Parking spot marked as ${newAvailability}`);
      fetchSpots();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update spot availability');
    }
  };

  if (!user?.id) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Redirecting to login...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {user.role === 'admin' ? 'All Parking Spots' : 'My Parking Spots'}
        </h1>
        {user.role === 'space-owner' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Add New Spot
          </button>
        )}
      </div>

      {/* Grid of spots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.map((spot) => (
          <div key={spot.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="relative h-48">
              <Image
                src={spot.imageUrl || '/placeholder-parking.png'}
                alt={spot.name ? `Parking spot: ${spot.name}` : 'Placeholder parking spot image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white">{spot.name}</h3>
              <p className="text-gray-400 mt-1">{spot.description}</p>
              <p className="text-gray-400 mt-1">£{spot.pricePerHour}/hour</p>
              <div className="mt-4 flex justify-between items-center">
                <div className="flex space-x-2">
                  {user.role === 'space-owner' && (
                    <>
                      <button
                        onClick={() => handleEditClick(spot)}
                        className="p-2 hover:bg-gray-700 rounded"
                      >
                        <FaEdit className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteSpot(spot.id)}
                        className="p-2 hover:bg-gray-700 rounded"
                      >
                        <FaTrash className="text-red-400" />
                      </button>
                      <button
                        onClick={() => handleAvailabilityChange(spot.id, spot.availability === 'available' ? 'unavailable' : 'available')}
                        className={`px-3 py-1 rounded text-xs ${
                          spot.availability === 'available' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {spot.availability}
                      </button>
                    </>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  spot.availability === 'available' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {spot.availability}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {spots.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No parking spots found</p>
          {user.role === 'space-owner' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Spot
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {user.role === 'space-owner' && (
        <>
          <AddSpotModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSpotAdded={handleSpotAdded}
            userId={user.id}
          />
          {selectedSpot && (
            <EditSpotModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSpotUpdated={handleSpotUpdated}
              spot={selectedSpot}
              userId={user.id}
            />
          )}
        </>
      )}
    </div>
  );
} 