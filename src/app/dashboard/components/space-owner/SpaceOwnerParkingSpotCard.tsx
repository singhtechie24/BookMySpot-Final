'use client';

import { ParkingSpot } from '@/types/parkingSpot';
import Image from 'next/image';
import { FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';

interface SpaceOwnerParkingSpotCardProps {
  spot: ParkingSpot;
  onEdit: (spot: ParkingSpot) => void;
  onDelete: (spot: ParkingSpot) => void;
  onToggleAvailability: (spot: ParkingSpot) => void;
}

export default function SpaceOwnerParkingSpotCard({ 
  spot, 
  onEdit, 
  onDelete,
  onToggleAvailability 
}: SpaceOwnerParkingSpotCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative h-40 sm:h-48">
        <Image
          src={spot.imageUrl || '/placeholder-parking.jpg'}
          alt={`Parking spot: ${spot.name}`}
          fill
          className="object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
          spot.availability === 'available' 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-500 text-white'
        }`}>
          {spot.availability === 'available' ? 'Available' : 'Unavailable'}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{spot.name}</h3>
        <div className="flex items-start gap-1 mt-1">
          <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-gray-400 text-sm line-clamp-1">{spot.address}</p>
            <p className="text-gray-400 text-sm">{spot.city}</p>
          </div>
        </div>
        <p className="text-lg font-bold text-white mt-3">£{spot.pricePerHour}/hour</p>
        
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => onEdit(spot)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FaEdit className="text-sm" /> 
              <span className="sm:hidden md:inline">Edit</span>
            </button>
            <button
              onClick={() => onDelete(spot)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <FaTrash className="text-sm" />
              <span className="sm:hidden md:inline">Delete</span>
            </button>
          </div>
          <button
            onClick={() => onToggleAvailability(spot)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              spot.availability === 'available' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {spot.availability === 'available' ? 'Mark as Unavailable' : 'Mark as Available'}
          </button>
        </div>
      </div>
    </div>
  );
} 