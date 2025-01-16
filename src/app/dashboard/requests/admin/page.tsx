'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface TimeSlot {
  start: string;
  end: string;
}

interface RequestData {
  id: string;
  type: 'new_spot' | 'edit_spot' | 'availability_update';
  spotId?: string;
  ownerId: string;
  ownerEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  pricePerHour?: number;
  imageUrl?: string;
  days?: string[];
  timeSlots?: TimeSlot[];
  currentSpotData?: {
    name: string;
    description: string;
    address: string;
    city: string;
    pricePerHour: number;
    imageUrl?: string;
    days: string[];
    timeSlots: TimeSlot[];
    spotId: string;
  };
  requestedSpotData?: {
    name: string;
    description: string;
    address: string;
    city: string;
    pricePerHour: number;
    imageUrl?: string;
    days: string[];
    timeSlots: TimeSlot[];
  };
  currentAvailability?: 'available' | 'unavailable';
  requestedAvailability?: 'available' | 'unavailable';
}

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, 'parkingSpotRequests');
        const requestsQuery = query(
          requestsRef,
          where('status', '==', 'pending')
        );
        
        const snapshot = await getDocs(requestsQuery);
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RequestData[];
        
        setRequests(requestsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, router]);

  const handleApprove = async (request: RequestData) => {
    try {
      if (!user) return;
      
      await updateDoc(doc(db, 'parkingSpotRequests', request.id), {
        status: 'approved',
        reviewedBy: user.id,
        reviewedAt: new Date()
      });

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (request: RequestData) => {
    try {
      if (!user) return;
      
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;

      await updateDoc(doc(db, 'parkingSpotRequests', request.id), {
        status: 'rejected',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        rejectionReason: reason
      });

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Pending Parking Spot Requests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request) => (
          <div key={request.id} className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Image Section */}
            {request.imageUrl && (
              <div className="relative h-48">
                <Image
                  src={request.imageUrl}
                  alt="Parking Spot"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            {/* Content Section */}
            <div className="p-4">
              {/* Request Type Badge */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {request.type === 'edit_spot' ? (
                      <>Edit Request for: <span className="text-blue-400">{request.currentSpotData?.name}</span></>
                    ) : request.type === 'availability_update' ? (
                      'Availability Update'
                    ) : (
                      request.name || 'New Spot Request'
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Submitted by: {request.ownerEmail}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Submitted: {request.createdAt?.toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  request.type === 'edit_spot' 
                    ? 'bg-purple-500/10 text-purple-400'
                    : request.type === 'availability_update'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {request.type === 'edit_spot' ? 'Edit Request' : 
                   request.type === 'availability_update' ? 'Availability' : 
                   'New Spot'}
                </span>
              </div>

              {/* Request Details */}
              {request.type === 'new_spot' && (
                <div className="space-y-2">
                  <p className="text-gray-300">{request.description}</p>
                  <p className="text-gray-400">Address: {request.address}</p>
                  <p className="text-gray-400">City: {request.city}</p>
                  <p className="text-gray-300">Price: £{request.pricePerHour}/hour</p>
                </div>
              )}

              {request.type === 'edit_spot' && request.currentSpotData && request.requestedSpotData && (
                <div className="space-y-2">
                  {request.currentSpotData.name !== request.requestedSpotData.name && (
                    <div>
                      <p className="text-sm text-gray-400">Name:</p>
                      <p className="line-through text-red-500">{request.currentSpotData.name}</p>
                      <p className="text-green-500">{request.requestedSpotData.name}</p>
                    </div>
                  )}
                  
                  {request.currentSpotData.description !== request.requestedSpotData.description && (
                    <div>
                      <p className="text-sm text-gray-400">Description:</p>
                      <p className="line-through text-red-500">{request.currentSpotData.description}</p>
                      <p className="text-green-500">{request.requestedSpotData.description}</p>
                    </div>
                  )}
                  
                  {request.currentSpotData.address !== request.requestedSpotData.address && (
                    <div>
                      <p className="text-sm text-gray-400">Address:</p>
                      <p className="line-through text-red-500">{request.currentSpotData.address}</p>
                      <p className="text-green-500">{request.requestedSpotData.address}</p>
                    </div>
                  )}
                  
                  {request.currentSpotData.pricePerHour !== request.requestedSpotData.pricePerHour && (
                    <div>
                      <p className="text-sm text-gray-400">Price per Hour:</p>
                      <p className="line-through text-red-500">£{request.currentSpotData.pricePerHour}</p>
                      <p className="text-green-500">£{request.requestedSpotData.pricePerHour}</p>
                    </div>
                  )}
                </div>
              )}

              {request.type === 'availability_update' && request.currentAvailability && request.requestedAvailability && (
                <div>
                  <p>Change availability from <span className="text-red-500">{request.currentAvailability}</span> to <span className="text-green-500">{request.requestedAvailability}</span></p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleApprove(request)}
                  className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                  title="Approve request"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={() => handleReject(request)}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  title="Reject request"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 