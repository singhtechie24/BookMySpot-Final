'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAdminPendingRequests, getSpaceOwnerRequests, approveParkingSpotRequest, rejectParkingSpotRequest } from '@/services/parkingSpotService';
import { ParkingSpotRequest } from '@/types/parkingSpot';
import Image from 'next/image';
import { FaCheck, FaTimes, FaSpinner, FaClock, FaImage, FaMapMarkerAlt, FaPoundSign, FaInfoCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { createNotification } from '@/services/notificationService';

const DEFAULT_IMAGE = 'https://placehold.co/600x400/1F2937/FFFFFF.png?text=No+Image';

export default function RequestsPage() {
  const [requests, setRequests] = useState<ParkingSpotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    // Redirect if not admin or space-owner
    if (user.role !== 'admin' && user.role !== 'space-owner') {
      router.push('/dashboard');
      return;
    }

    const loadRequests = async () => {
      try {
        let pendingRequests;
        if (user.role === 'admin') {
          pendingRequests = await getAdminPendingRequests(user.id);
        } else if (user.role === 'space-owner') {
          pendingRequests = await getSpaceOwnerRequests(user.id);
        }
        console.log('Loaded requests:', pendingRequests); // Debug log
        setRequests(pendingRequests || []);
      } catch (error) {
        console.error('Error loading requests:', error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user, router]);

  const handleApprove = async (requestId: string) => {
    if (!user?.id || user.role !== 'admin') return;
    setProcessing(requestId);
    try {
      await approveParkingSpotRequest(user.id, requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id || user.role !== 'admin') return;
    
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) {
      toast.error('A rejection reason is required');
      return;
    }

    setProcessing(requestId);
    try {
      await rejectParkingSpotRequest(user.id, requestId, reason);
      const request = requests.find(r => r.id === requestId);
      
      if (request) {
        await createNotification({
          userId: request.ownerId,
          title: 'Request Rejected',
          message: `Your request has been rejected. Reason: ${reason}`,
          notificationType: 'rejection',
          status: 'unread',
          action: {
            type: 'view',
            link: '/dashboard/my-requests'
          }
        });
      }
      
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleImageError = (requestId: string) => {
    setImageErrors(prev => new Set([...prev, requestId]));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {user?.role === 'admin' ? 'Pending Requests' : 'My Requests'}
        </h1>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur-sm">
          <FaInfoCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 text-base sm:text-lg">
            {user?.role === 'admin' 
              ? "No pending requests at the moment"
              : "You haven't submitted any requests yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-gray-800/70 rounded-lg overflow-hidden border border-gray-700 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-[36rem]">
              <div className="relative h-40 sm:h-48 bg-gray-700 flex-shrink-0">
                {imageErrors.has(request.id) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <FaImage className="w-12 h-12 text-gray-600" />
                  </div>
                ) : (
                  <Image
                    src={request.imageUrl || DEFAULT_IMAGE}
                    alt={request.spotName || 'Parking Spot'}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    onError={() => handleImageError(request.id)}
                    priority={false}
                  />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg ${
                    request.type === 'edit_spot' 
                      ? 'bg-purple-500/90 text-white'
                      : request.type === 'availability_update'
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-yellow-500/90 text-white'
                  }`}>
                    {request.type === 'edit_spot' ? 'Edit Request' : 
                     request.type === 'availability_update' ? 'Availability' : 
                     'New Spot'}
                  </span>
                </div>
              </div>

              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold mb-2 truncate">
                  {request.type === 'edit_spot' ? (
                    <>Edit Request: <span className="text-blue-400">{request.currentSpotData?.name}</span></>
                  ) : request.type === 'availability_update' ? (
                    'Availability Update'
                  ) : (
                    request.spotName || 'New Spot Request'
                  )}
                </h3>
                <div className="flex flex-wrap items-center text-gray-400 text-xs space-x-3">
                  <div className="flex items-center">
                    <FaClock className="w-3.5 h-3.5 mr-1" />
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </div>
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                    <span className="truncate max-w-[150px]">{request.ownerEmail}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {request.type === 'new_spot' && (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">{request.description}</p>
                    <div className="flex items-center text-gray-400">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <div className="truncate">
                        <span>{request.address}</span>
                        <span className="mx-1">·</span>
                        <span>{request.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <FaPoundSign className="w-3.5 h-3.5 mr-1.5" />
                      <p>{request.pricePerHour}/hour</p>
                    </div>
                  </div>
                )}

                {request.type === 'edit_spot' && request.currentSpotData && request.requestedSpotData && (
                  <>
                    {request.currentSpotData.imageUrl !== request.requestedSpotData.imageUrl && (
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs font-medium text-gray-400 mb-2">Image Changes:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-red-400 mb-1">Current</p>
                            <div className="relative h-20 bg-gray-700 rounded overflow-hidden">
                              <Image
                                src={request.currentSpotData.imageUrl || DEFAULT_IMAGE}
                                alt="Current"
                                fill
                                className="object-cover"
                                onError={() => handleImageError(request.id)}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-green-400 mb-1">New</p>
                            <div className="relative h-20 bg-gray-700 rounded overflow-hidden">
                              <Image
                                src={request.requestedSpotData.imageUrl || DEFAULT_IMAGE}
                                alt="New"
                                fill
                                className="object-cover"
                                onError={() => handleImageError(request.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.currentSpotData.name !== request.requestedSpotData.name && (
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs font-medium text-gray-400 mb-1">Name:</p>
                        <p className="line-through text-red-400 text-xs">{request.currentSpotData.name}</p>
                        <p className="text-green-400 text-xs">{request.requestedSpotData.name}</p>
                      </div>
                    )}
                    
                    {request.currentSpotData.description !== request.requestedSpotData.description && (
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs font-medium text-gray-400 mb-1">Description:</p>
                        <p className="line-through text-red-400 text-xs">{request.currentSpotData.description}</p>
                        <p className="text-green-400 text-xs">{request.requestedSpotData.description}</p>
                      </div>
                    )}
                    
                    {(request.currentSpotData.address !== request.requestedSpotData.address || 
                      request.currentSpotData.city !== request.requestedSpotData.city) && (
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs font-medium text-gray-400 mb-1">Location:</p>
                        <div className="space-y-1">
                          {request.currentSpotData.address !== request.requestedSpotData.address && (
                            <div>
                              <p className="line-through text-red-400 text-xs">{request.currentSpotData.address}</p>
                              <p className="text-green-400 text-xs">{request.requestedSpotData.address}</p>
                            </div>
                          )}
                          {request.currentSpotData.city !== request.requestedSpotData.city && (
                            <div>
                              <p className="line-through text-red-400 text-xs">{request.currentSpotData.city}</p>
                              <p className="text-green-400 text-xs">{request.requestedSpotData.city}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {request.currentSpotData.pricePerHour !== request.requestedSpotData.pricePerHour && (
                      <div className="bg-gray-900/50 p-2 rounded">
                        <p className="text-xs font-medium text-gray-400 mb-1">Price:</p>
                        <p className="line-through text-red-400 text-xs">£{request.currentSpotData.pricePerHour}/hour</p>
                        <p className="text-green-400 text-xs">£{request.requestedSpotData.pricePerHour}/hour</p>
                      </div>
                    )}
                  </>
                )}

                {request.type === 'availability_update' && request.currentAvailability && request.requestedAvailability && (
                  <div className="bg-gray-900/50 p-2 rounded">
                    <p className="text-xs font-medium text-gray-400 mb-2">Status Change:</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs">{request.currentAvailability}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs">{request.requestedAvailability}</span>
                    </div>
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <div className="p-4 border-t border-gray-700 flex-shrink-0 bg-gray-800/90 backdrop-blur-sm">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={!!processing}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      {processing === request.id ? (
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <FaCheck className="w-3.5 h-3.5 mr-1.5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={!!processing}
                      className="flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      {processing === request.id ? (
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <FaTimes className="w-3.5 h-3.5 mr-1.5" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 