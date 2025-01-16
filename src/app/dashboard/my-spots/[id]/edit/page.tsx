'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/config/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { requestSpotEdit } from '@/services/parkingSpotService';
import { toast } from 'react-hot-toast';
import { ParkingSpot } from '@/types/parkingSpot';
import { storage } from '@/config/firebase-client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EditSpotPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSpotPage({ params }: EditSpotPageProps) {
  const { id: spotId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    pricePerHour: 0,
    imageUrl: '',
    days: [] as string[],
    timeSlots: [{ start: '09:00', end: '17:00' }]
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSpotData = async () => {
      try {
        const spotRef = doc(db, 'parkingSpots', spotId);
        const spotDoc = await getDoc(spotRef);

        if (!spotDoc.exists()) {
          setError('Parking spot not found');
          return;
        }

        const data = spotDoc.data() as ParkingSpot;
        
        // Check if user owns this spot
        if (data.ownerId !== user.id) {
          setError('You do not have permission to edit this spot');
          return;
        }

        setFormData({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          pricePerHour: data.pricePerHour || 0,
          imageUrl: data.imageUrl || '',
          days: data.days || [],
          timeSlots: data.timeSlots || [{ start: '09:00', end: '17:00' }]
        });
      } catch (error) {
        console.error('Error fetching spot data:', error);
        setError('Failed to load parking spot data');
      } finally {
        setLoading(false);
      }
    };

    fetchSpotData();
  }, [spotId, user, router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to edit a spot');
      return;
    }

    try {
      let updatedFormData = { ...formData };

      // If a new image was selected, upload it
      if (imageFile) {
        const storageRef = ref(storage, `parking-spots/${spotId}/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(storageRef);
        updatedFormData.imageUrl = imageUrl;
      }

      await requestSpotEdit(user.id, spotId, updatedFormData);
      toast.success('Edit request submitted for admin approval');
      router.push('/dashboard/my-spots');
    } catch (error) {
      console.error('Error submitting edit request:', error);
      toast.error('Failed to submit edit request');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pricePerHour' ? parseFloat(value) || 0 : value
    }));
  };

  if (!user) {
    return null; // Let the useEffect handle the redirect
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Parking Spot</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700"
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-2">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700"
            required
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-2">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700"
            required
          />
        </div>

        <div>
          <label htmlFor="pricePerHour" className="block text-sm font-medium mb-2">Price per Hour (£)</label>
          <input
            type="number"
            id="pricePerHour"
            name="pricePerHour"
            value={formData.pricePerHour}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-2">Parking Spot Image</label>
          <div className="flex flex-col space-y-2">
            {formData.imageUrl && (
              <img 
                src={formData.imageUrl} 
                alt="Current parking spot" 
                className="w-48 h-48 object-cover rounded-lg"
              />
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700"
            />
            <p className="text-sm text-gray-400">Max file size: 5MB. Recommended size: 800x600 pixels</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Submit Edit Request
          </button>
        </div>
      </form>
    </div>
  );
} 