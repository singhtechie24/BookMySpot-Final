'use client';

import { useState } from 'react';
import { ParkingSpot } from '@/types/parkingSpot';
import { FaMapMarkerAlt, FaClock, FaPoundSign, FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { deleteParkingSpot, updateParkingSpot } from '@/services/parkingSpotService';
import Image from 'next/image';

interface AdminParkingSpotCardProps {
  spot: ParkingSpot;
}

export default function AdminParkingSpotCard({ spot }: AdminParkingSpotCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteParkingSpot(spot.id);
      // The spot will be removed from the list automatically due to the subscription
    } catch (error) {
      console.error('Error deleting spot:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newAvailability = spot.availability === 'available' ? 'unavailable' : 'available';
      await updateParkingSpot(spot.id, { availability: newAvailability });
    } catch (error) {
      console.error('Error updating spot availability:', error);
    }
  };

  const getStatusBadge = () => {
    switch (spot.status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition-colors">
      {/* Image Section */}
      <div className="relative h-48">
        {spot.imageUrl ? (
          <Image
            src={spot.imageUrl}
            alt={spot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
            <FaMapMarkerAlt className="text-4xl text-gray-500" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {getStatusBadge()}
          <span className={`px-2 py-1 text-xs rounded-full ${
            spot.availability === 'available'
              ? 'bg-green-500/20 text-green-400 border border-green-500/20'
              : 'bg-red-500/20 text-red-400 border border-red-500/20'
          }`}>
            {spot.availability === 'available' ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{spot.name}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-400">
            <FaMapMarkerAlt className="mr-2" />
            <span className="text-sm">{spot.address}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <FaPoundSign className="mr-2" />
            <span className="text-sm">£{spot.pricePerHour}/hour</span>
          </div>
          <div className="flex items-center text-gray-400">
            <FaClock className="mr-2" />
            <span className="text-sm">Created {format(new Date(spot.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Actions */}
        {!showDeleteConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleAvailability()}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                spot.availability === 'available'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {spot.availability === 'available' ? 'Mark Unavailable' : 'Mark Available'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <FaTrash />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 