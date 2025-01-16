'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase-client';
import { FaSpinner, FaImage, FaClock, FaMapMarkerAlt, FaPoundSign, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function AddSpotPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spotData, setSpotData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    pricePerHour: '',
    days: [] as string[],
    timeSlots: [{ start: '09:00', end: '17:00' }]
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-500/5');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-500/5');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-500/5');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload an image of your parking spot');
      return;
    }

    if (!spotData.name || !spotData.address || !spotData.city || !spotData.pricePerHour || spotData.days.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Upload image first
      const imageRef = ref(storage, `parking-spots/${Date.now()}-${imageFile.name}`);
      const uploadResult = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // Create a request in parkingSpotRequests collection
      const requestData = {
        name: spotData.name,
        description: spotData.description || '',
        address: spotData.address,
        city: spotData.city,
        pricePerHour: parseFloat(spotData.pricePerHour),
        imageUrl,
        ownerId: user.id,
        ownerEmail: user.email,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: 'new_spot',
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        days: [...spotData.days],
        timeSlots: spotData.timeSlots.map(slot => ({
          start: slot.start,
          end: slot.end
        }))
      };

      await addDoc(collection(db, 'parkingSpotRequests'), requestData);
      
      toast.success('Your request has been submitted! An admin will review it shortly.');
      router.push('/dashboard/my-requests');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setSpotData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleTimeSlotChange = (index: number, field: 'start' | 'end', value: string) => {
    setSpotData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const addTimeSlot = () => {
    setSpotData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { start: '09:00', end: '17:00' }]
    }));
  };

  const removeTimeSlot = (index: number) => {
    setSpotData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Add New Parking Spot</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in the details below to list your parking spot</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-xl space-y-6">
                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Spot Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={spotData.name}
                      onChange={(e) => setSpotData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-4 pr-10 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="e.g., City Center Parking Space"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={spotData.description}
                    onChange={(e) => setSpotData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    rows={4}
                    placeholder="Describe your parking spot (size, security features, access instructions, etc.)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price per Hour *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPoundSign className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={spotData.pricePerHour}
                      onChange={(e) => setSpotData(prev => ({ ...prev, pricePerHour: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl space-y-6">
                <h2 className="text-lg font-semibold text-white">Location Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={spotData.address}
                      onChange={(e) => setSpotData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={spotData.city}
                    onChange={(e) => setSpotData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter city name"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Image and Availability */}
            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-xl space-y-6">
                <h2 className="text-lg font-semibold text-white">Spot Image</h2>
                <div
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg transition-all duration-200 cursor-pointer group hover:border-blue-500/50 hover:bg-blue-500/5"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative w-full h-64 mb-4 group">
                        <img
                          src={imagePreview}
                          alt="Spot preview"
                          className="mx-auto max-h-64 rounded-lg object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <p className="text-white text-sm">Click or drag to change image</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="group-hover:scale-105 transition-transform duration-200">
                        <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-400 mt-4">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none"
                          >
                            <span>Upload an image</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              ref={fileInputRef}
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl space-y-6">
                <h2 className="text-lg font-semibold text-white">Availability</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available Days *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          spotData.days.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Time Slots *
                    </label>
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + Add slot
                    </button>
                  </div>
                  <div className="space-y-3">
                    {spotData.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-700 p-3 rounded-lg group">
                        <div className="text-gray-400">
                          <FaClock />
                        </div>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                          className="px-3 py-1 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                          className="px-3 py-1 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        {spotData.timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit for Approval</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 