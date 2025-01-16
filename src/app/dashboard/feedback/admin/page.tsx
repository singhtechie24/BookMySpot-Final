'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FeedbackService } from '@/services/feedbackService';
import { Feedback, FeedbackStatus } from '@/types/feedback';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaComments, FaExclamationTriangle, FaBug, FaLightbulb } from 'react-icons/fa';

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Only admins can access this page
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const feedbackRef = collection(db, 'feedback');
        const feedbackQuery = query(
          feedbackRef,
          where('target', '==', 'admin'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
          const feedbackData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Feedback[];
          setFeedback(feedbackData);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching feedback:', error);
          toast.error('Failed to load feedback');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up feedback listener:', error);
        toast.error('Failed to load feedback');
        setLoading(false);
      }
    };

    fetchFeedback();
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

      // Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userId: feedbackItem.userId,
        title: 'Feedback Response',
        message: `Admin has responded to your feedback: "${feedbackItem.subject}"`,
        type: 'feedback_response',
        status: 'unread',
        createdAt: serverTimestamp(),
        data: {
          feedbackId: feedbackId,
          response: response
        },
        action: {
          type: 'view',
          link: '/dashboard/feedback'
        }
      });

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Feedback Management</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeedback.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
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

            <p className="text-gray-300">{item.description}</p>

            {item.response && (
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300">Response:</p>
                <p className="text-white mt-1">{item.response}</p>
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Priority: {item.priority}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>

            {item.status === 'pending' && (
              <button
                onClick={() => handleRespond(item.id)}
                disabled={!!responding}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {responding === item.id ? 'Sending...' : 'Respond'}
              </button>
            )}
          </div>
        ))}

        {filteredFeedback.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FaComments className="mx-auto text-4xl text-gray-600 mb-4" />
            <p className="text-gray-400">No feedback found</p>
          </div>
        )}
      </div>
    </div>
  );
} 