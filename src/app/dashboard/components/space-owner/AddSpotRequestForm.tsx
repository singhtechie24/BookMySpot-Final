'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { User } from '@/services/userService';
import { FaUpload, FaClock, FaDollarSign, FaMapMarkerAlt, FaImage, FaPoundSign } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Combobox } from '@headlessui/react';

interface AddSpotRequestFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function AddSpotRequestForm({ user, onSuccess, onCancel }: AddSpotRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    pricePerHour: '',
    timeSlots: [{ start: '09:00', end: '17:00' }] as TimeSlot[]
  });

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'gb' }, // Restrict to UK
    },
    debounce: 300,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTimeSlots = [...formData.timeSlots];
    newTimeSlots[index] = {
      ...newTimeSlots[index],
      [field]: value
    };
    setFormData({ ...formData, timeSlots: newTimeSlots });
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [...formData.timeSlots, { start: '09:00', end: '17:00' }]
    });
  };

  const removeTimeSlot = (index: number) => {
    const newTimeSlots = formData.timeSlots.filter((_, i) => i !== index);
    setFormData({ ...formData, timeSlots: newTimeSlots });
  };

  const handleAddressSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      // Extract city from address components
      const cityComponent = results[0].address_components.find(
        component => component.types.includes('locality')
      );
      
      setFormData(prev => ({
        ...prev,
        address,
        city: cityComponent?.long_name || '',
        location: { lat, lng }
      }));
    } catch (error) {
      console.error('Error getting geocode:', error);
      toast.error('Error getting location details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      if (imageFile) {
        const imageRef = ref(storage, `parking-spots/${Date.now()}-${imageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const spotData = {
        ...formData,
        pricePerHour: parseFloat(formData.pricePerHour),
        imageUrl,
        ownerId: user.id,
        ownerEmail: user.email,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'parkingSpots'), spotData);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding spot:', error);
      alert('Failed to add parking spot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Spot Image</label>
        <div className="flex items-center justify-center w-full">
          <label className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-gray-500">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaUpload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 800x400px)</p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300">Spot Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Price per Hour ($)</label>
          <div className="mt-1 relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaDollarSign className="text-gray-400" />
            </div>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.pricePerHour}
              onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
              className="block w-full bg-gray-700 text-white rounded-lg pl-10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Address</label>
          <div className="mt-1 relative rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMapMarkerAlt className="text-gray-400" />
            </div>
            <Combobox value={formData.address} onChange={handleAddressSelect}>
              <div className="relative">
                <Combobox.Input
                  className="block w-full bg-gray-700 text-white rounded-lg pl-10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!ready}
                  placeholder="Enter address..."
                />
                <Combobox.Options className="absolute z-10 mt-1 w-full bg-gray-700 rounded-md shadow-lg">
                  {status === 'OK' && data.map(({ place_id, description }) => (
                    <Combobox.Option
                      key={place_id}
                      value={description}
                      className={({ active }) =>
                        `${active ? 'bg-blue-600' : ''} cursor-pointer select-none py-2 px-4 text-white`
                      }
                    >
                      {description}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </div>
            </Combobox>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">City</label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="mt-1 block w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300">Description</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Time Slots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">Time Slots</label>
          <button
            type="button"
            onClick={addTimeSlot}
            className="text-blue-500 hover:text-blue-400 text-sm"
          >
            + Add Time Slot
          </button>
        </div>
        {formData.timeSlots.map((slot, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaClock className="text-gray-400" />
                </div>
                <input
                  type="time"
                  required
                  value={slot.start}
                  onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                  className="block w-full bg-gray-700 text-white rounded-lg pl-10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <span className="text-gray-400">to</span>
            <div className="flex-1">
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaClock className="text-gray-400" />
                </div>
                <input
                  type="time"
                  required
                  value={slot.end}
                  onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                  className="block w-full bg-gray-700 text-white rounded-lg pl-10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {formData.timeSlots.length > 1 && (
              <button
                type="button"
                onClick={() => removeTimeSlot(index)}
                className="text-red-500 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-300 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
} 