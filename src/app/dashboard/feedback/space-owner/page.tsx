'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FeedbackService } from '@/services/feedbackService';
import { Feedback, FeedbackStatus } from '@/types/feedback';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaComments, FaExclamationTriangle, FaBug, FaLightbulb, FaParking, FaFilter, FaCalendarAlt, FaReply, FaCheck, FaClock } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

const formatCreatedAt = (timestamp: any) => {
  if (!timestamp) return 'Unknown date';
  
  try {
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export default function SpaceOwnerFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    if (user.role !== 'space-owner') {
      router.push('/dashboard');
      return;
    }

    const feedbackRef = collection(db, 'feedback');
    const feedbackQuery = query(
      feedbackRef,
      where('target', '==', 'space-owner'),
      where('spaceOwnerId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedback(feedbackData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const getFeedbackIcon = (type: string) => {
    switch (type) {
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

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'resolved':
        return 'bg-green-500/10 text-green-500';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getFeedbackStats = () => {
    return {
      total: feedback.length,
      pending: feedback.filter(f => f.status === 'pending').length,
      inProgress: feedback.filter(f => f.status === 'in-progress').length,
      resolved: feedback.filter(f => f.status === 'resolved').length,
      urgent: feedback.filter(f => f.priority === 'urgent').length
    };
  };

  const handleRespond = async (feedbackId: string) => {
    const feedbackItem = feedback.find(f => f.id === feedbackId);
    if (!feedbackItem) return;

    const response = prompt('Enter your response:');
    if (!response) return;

    try {
      setResponding(feedbackId);
      await FeedbackService.respondToFeedback(
        feedbackId,
        response,
        'resolved',
        user!.id
      );
      toast.success('Response sent successfully');
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast.error('Failed to send response');
    } finally {
      setResponding(null);
    }
  };

  const filteredFeedback = feedback.filter(f => 
    filter === 'all' ? true : f.status === filter
  );

  const stats = getFeedbackStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <p className="text-gray-400">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Feedback Management</h1>
          <p className="text-gray-400 mt-1">Manage and respond to user feedback about your parking spots</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Feedback</p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FaComments className="text-xl text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-4 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <FaClock className="text-xl text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-xl font-bold text-white mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FaReply className="text-xl text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-xl font-bold text-white mt-1">{stats.resolved}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <FaCheck className="text-xl text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 rounded-xl border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Urgent</p>
              <p className="text-xl font-bold text-white mt-1">{stats.urgent}</p>
            </div>
            <div className="bg-red-500/20 p-2 rounded-lg">
              <FaExclamationTriangle className="text-xl text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaFilter className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FeedbackStatus | 'all')}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Feedback List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedback.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-700/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaComments className="text-4xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No feedback found</h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? "You haven't received any feedback yet"
                  : `No ${filter} feedback available`}
              </p>
            </div>
          ) : (
            filteredFeedback.map((item) => (
              <div 
                key={item.id} 
                className={`bg-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-700/70 transition-colors ${
                  item.priority === 'urgent' ? 'border-l-4 border-red-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getFeedbackIcon(item.type)}
                      <div>
                        <h3 className="font-medium text-white">{item.subject}</h3>
                        <p className="text-sm text-gray-400">{item.userEmail}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  {item.parkingSpotId && (
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                      <FaParking className="text-blue-400" />
                      <span className="text-sm">Spot ID: {item.parkingSpotId}</span>
                    </div>
                  )}

                  <p className="text-gray-300 text-sm mb-4">{item.description}</p>

                  {item.response && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-400">Your Response:</p>
                      <p className="text-white mt-1 text-sm">{item.response}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full ${
                        item.priority === 'urgent' 
                          ? 'bg-red-500/10 text-red-400'
                          : item.priority === 'high'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-gray-600/10 text-gray-400'
                      }`}>
                        {item.priority}
                      </span>
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-500" />
                        <span>{formatCreatedAt(item.createdAt)}</span>
                      </div>
                    </div>

                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleRespond(item.id)}
                        disabled={!!responding}
                        className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                      >
                        {responding === item.id ? 'Sending...' : 'Respond'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 