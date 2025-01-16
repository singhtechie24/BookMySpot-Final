'use client';

import { useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ParkingSpot } from '@/types/parkingSpot';
import { createParkingSpot } from '@/services/parkingSpotService';
import toast from 'react-hot-toast';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpotAdded: () => void;
  userId: string;
}

interface FormData {
  name: string;
  description: string;
  pricePerHour: number;
  address: string;
  city: string;
  days: string[];
  timeSlots: { start: string; end: string; }[];
}

export function AddSpotModal({ isOpen, onClose, onSpotAdded, userId }: AddSpotModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    pricePerHour: 0,
    address: '',
    city: '',
    days: [],
    timeSlots: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image to Firebase Storage
      let imageUrl = '';
      if (imageFile) {
        const storage = getStorage();
        const imageRef = ref(storage, `parking-spots/${userId}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Get user email for ownerEmail field
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (!userData?.email) {
        throw new Error('User email not found');
      }

      // Create parking spot
      const newSpot: Omit<ParkingSpot, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        description: formData.description,
        pricePerHour: formData.pricePerHour,
        address: formData.address,
        city: formData.city,
        createdBy: userId,
        ownerEmail: userData.email,
        availability: 'available',
        imageUrl: imageUrl || '/placeholder-parking.png',
        days: formData.days,
        timeSlots: formData.timeSlots,
        status: 'approved',
        ownerId: userId,
        spaceOwnerId: userId
      };

      await createParkingSpot(newSpot);
      toast.success('Parking spot added successfully');
      onSpotAdded();
      onClose();
    } catch (error) {
      console.error('Error adding parking spot:', error);
      toast.error('Failed to add parking spot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Add New Parking Spot</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-blue-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-blue-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">Price per Hour</label>
            <input
              type="number"
              value={formData.pricePerHour}
              onChange={(e) => setFormData(prev => ({ ...prev, pricePerHour: parseFloat(e.target.value) }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-blue-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-blue-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-blue-500 focus:bg-gray-600 focus:ring-0 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Parking Spot'}
          </button>
        </form>
      </div>
    </div>
  );
} 