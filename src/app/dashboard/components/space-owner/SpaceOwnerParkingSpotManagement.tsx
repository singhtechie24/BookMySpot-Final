'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { ParkingSpot } from '@/types/parkingSpot';
import { User } from '@/services/userService';
import SpaceOwnerParkingSpotCard from './SpaceOwnerParkingSpotCard';
import { FaSearch, FaPlus } from 'react-icons/fa';
import AddParkingSpotModal from './AddParkingSpotModal';
import { useRouter } from 'next/navigation';
import { updateSpotAvailability } from '@/services/parkingSpotService';
import { toast } from 'react-hot-toast';
import { UserService } from '@/services/userService';

interface SpaceOwnerParkingSpotManagementProps {
  user: User;
}

type FilterType = 'all' | 'available' | 'unavailable';

export default function SpaceOwnerParkingSpotManagement({ user }: SpaceOwnerParkingSpotManagementProps) {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) return;

    // Update user role format if needed
    UserService.updateUserRoleFormat(user.id).catch(console.error);

    const spotsRef = collection(db, 'parkingSpots');
    let spotsQuery = query(
      spotsRef,
      where('status', '==', 'approved'),
      where('ownerId', '==', user.id)
    );

    if (filter !== 'all') {
      spotsQuery = query(
        spotsRef,
        where('status', '==', 'approved'),
        where('ownerId', '==', user.id),
        where('availability', '==', filter)
      );
    }

    const unsubscribe = onSnapshot(spotsQuery, (snapshot) => {
      const newSpots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[];

      setSpots(newSpots);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, filter]);

  const handleEdit = async (spot: ParkingSpot) => {
    router.push(`/dashboard/my-spots/${spot.id}/edit`);
  };

  const handleDelete = async (spot: ParkingSpot) => {
    if (window.confirm('Are you sure you want to delete this parking spot?')) {
      try {
        const spotRef = doc(db, 'parkingSpots', spot.id);
        await deleteDoc(spotRef);
      } catch (error) {
        console.error('Error deleting parking spot:', error);
        alert('Failed to delete parking spot. Please try again.');
      }
    }
  };

  const handleToggleAvailability = async (spot: ParkingSpot) => {
    try {
      // Log detailed information about the spot and user
      console.log('Spot and user details:', {
        spot: {
          id: spot.id,
          ownerId: spot.ownerId,
          availability: spot.availability,
          status: spot.status
        },
        user: {
          id: user.id,
          role: user.role
        },
        ownershipMatch: spot.ownerId === user.id
      });
      
      const newAvailability = spot.availability === 'available' ? 'unavailable' : 'available';
      await updateSpotAvailability(user.id, spot.id, newAvailability);
      toast.success(`Spot marked as ${newAvailability}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update spot availability');
    }
  };

  const filteredSpots = spots.filter(spot => 
    spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spot.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spot.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">My Parking Spots</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <FaPlus /> Add New Spot
        </button>
      </div>

      {/* Search and Filter */}
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
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Spots</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpots.map((spot) => (
          <SpaceOwnerParkingSpotCard
            key={spot.id}
            spot={spot}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredSpots.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No parking spots found</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Add Your First Spot
          </button>
        </div>
      )}

      {/* Add Parking Spot Modal */}
      <AddParkingSpotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        user={user}
      />
    </div>
  );
} 