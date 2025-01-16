'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FaComments, FaExclamationTriangle, FaBug, FaLightbulb } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { FeedbackType, FeedbackPriority, FeedbackTarget } from '@/types/feedback';

interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  ownerId: string;
}

export default function SubmitFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<FeedbackType>('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('low');
  const [target, setTarget] = useState<FeedbackTarget>('admin');
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Prevent admins from accessing this page
    if (user.role === 'admin') {
      router.push('/dashboard/feedback/admin');
    }
  }, [user, router]);

  // Fetch parking spots when target is space-owner
  useEffect(() => {
    if (target === 'space-owner') {
      const fetchParkingSpots = async () => {
        setLoading(true);
        try {
          const spotsRef = collection(db, 'parkingSpots');
          const spotsQuery = query(spotsRef, where('status', '==', 'approved'));
          const spotsSnapshot = await getDocs(spotsQuery);
          const spots = spotsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ParkingSpot[];
          setParkingSpots(spots);
        } catch (error) {
          console.error('Error fetching parking spots:', error);
          toast.error('Failed to load parking spots');
        } finally {
          setLoading(false);
        }
      };

      fetchParkingSpots();
    }
  }, [target]);

  const getFeedbackIcon = (feedbackType: FeedbackType) => {
    switch (feedbackType) {
      case 'general':
        return <FaComments className="text-blue-500" />;
      case 'complaint':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'bug':
        return <FaBug className="text-yellow-500" />;
      case 'suggestion':
        return <FaLightbulb className="text-green-500" />;
      default:
        return <FaComments className="text-blue-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);

      let spaceOwnerId = null;
      let parkingSpotId = null;

      if (target === 'space-owner') {
        if (!selectedSpot) {
          toast.error('Please select a parking spot');
          return;
        }
        const spot = parkingSpots.find(s => s.id === selectedSpot);
        if (!spot) {
          toast.error('Invalid parking spot selected');
          return;
        }
        spaceOwnerId = spot.ownerId;
        parkingSpotId = spot.id;
      }

      const feedbackData = {
        userId: user.id,
        userEmail: user.email,
        type,
        target,
        subject,
        description,
        priority,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(parkingSpotId && { parkingSpotId }),
        ...(spaceOwnerId && { spaceOwnerId })
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      toast.success('Feedback submitted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Submit Feedback</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Feedback Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['general', 'complaint', 'bug', 'suggestion'] as FeedbackType[]).map((feedbackType) => (
                <button
                  key={feedbackType}
                  type="button"
                  onClick={() => setType(feedbackType)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                    type === feedbackType
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {getFeedbackIcon(feedbackType)}
                  <span className="mt-2 text-sm capitalize">
                    {feedbackType}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Send To
            </label>
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as FeedbackTarget);
                setSelectedSpot(''); // Reset selected spot when changing target
              }}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="space-owner">Space Owner</option>
            </select>
          </div>

          {target === 'space-owner' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Parking Spot
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                <select
                  value={selectedSpot}
                  onChange={(e) => setSelectedSpot(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a parking spot</option>
                  {parkingSpots.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name} - {spot.address}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Brief subject of your feedback"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
              required
              placeholder="Detailed description of your feedback"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || (target === 'space-owner' && !selectedSpot)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
} 