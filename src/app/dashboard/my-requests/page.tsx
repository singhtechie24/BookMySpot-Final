'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { ParkingSpotRequest } from '@/types/parkingSpot';
import Image from 'next/image';
import { FaSpinner, FaClock, FaMapMarkerAlt, FaMoneyBillWave, FaFilter, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'expired':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(status)} capitalize`}>
      {status}
    </span>
  );
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ParkingSpotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const router = useRouter();

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
          where('ownerId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(requestsQuery);
        const requestsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ownerId: data.ownerId || '',
            name: data.name || '',
            spotName: data.name || '',
            description: data.description || '',
            address: data.address || '',
            city: data.city || '',
            pricePerHour: data.pricePerHour || 0,
            imageUrl: data.imageUrl || '',
            status: data.status || 'pending',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            type: data.type || 'new_spot',
            reviewedBy: data.reviewedBy || null,
            rejectionReason: data.rejectionReason || null,
            days: Array.isArray(data.days) ? data.days : [],
            timeSlots: Array.isArray(data.timeSlots) ? data.timeSlots : []
          } as ParkingSpotRequest;
        });

        setRequests(requestsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, router]);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesSearch = request.spotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getRequestStats = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  };

  const stats = getRequestStats();

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

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
        <FaExclamationCircle className="text-4xl mb-4" />
        <p className="text-xl font-medium mb-2">No Requests Found</p>
        <p className="text-gray-500">You haven't submitted any parking spot requests yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">My Parking Spot Requests</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and track your parking spot requests</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gray-800 p-3 md:p-4 rounded-xl border border-gray-700">
          <p className="text-xs md:text-sm text-gray-400">Total Requests</p>
          <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-500/10 p-3 md:p-4 rounded-xl border border-yellow-500/20">
          <p className="text-xs md:text-sm text-yellow-400">Pending</p>
          <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-500/10 p-3 md:p-4 rounded-xl border border-green-500/20">
          <p className="text-xs md:text-sm text-green-400">Approved</p>
          <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mt-1">{stats.approved}</p>
        </div>
        <div className="bg-red-500/10 p-3 md:p-4 rounded-xl border border-red-500/20">
          <p className="text-xs md:text-sm text-red-400">Rejected</p>
          <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by spot name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400 text-sm" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
            <FaExclamationCircle className="text-3xl mb-4" />
            <p className="text-lg">No requests match your filters</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-white truncate">{request.spotName}</h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="flex items-center text-gray-400 mt-2 text-sm">
                    <FaMapMarkerAlt className="mr-1.5 flex-shrink-0" />
                    <p className="truncate">{request.address}</p>
                  </div>
                  <div className="flex items-center text-gray-400 mt-1 text-sm">
                    <FaMoneyBillWave className="mr-1.5 flex-shrink-0" />
                    <p>£{request.pricePerHour}/hour</p>
                  </div>
                </div>
              </div>

              {request.imageUrl && (
                <div className="mt-3 relative h-32 rounded-lg overflow-hidden">
                  <Image
                    src={request.imageUrl}
                    alt={request.spotName}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                </div>
              )}

              <div className="mt-3">
                <p className="text-gray-400 text-sm line-clamp-2">{request.description}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <p>{format(request.createdAt, 'MMM d, yyyy')}</p>
                <p>{formatDistanceToNow(request.createdAt)} ago</p>
              </div>

              {request.status === 'pending' && (
                <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs">
                    <FaClock className="inline-block mr-1.5" />
                    Expires {formatDistanceToNow(request.expiresAt)} from now
                  </p>
                </div>
              )}

              {request.status === 'rejected' && request.rejectionReason && (
                <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-red-400 text-xs font-medium mb-1">Rejection Reason:</p>
                  <p className="text-gray-400 text-xs line-clamp-2">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 