'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Feedback } from '@/types/feedback';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaComments, FaExclamationTriangle, FaBug, FaLightbulb } from 'react-icons/fa';

export default function MyFeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const feedbackRef = collection(db, 'feedback');
    const feedbackQuery = query(
      feedbackRef,
      where('userId', '==', user.id),
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
  }, [user?.id]);

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

  const getStatusColor = (status: string) => {
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
        <h1 className="text-2xl font-bold text-white">My Feedback</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedback.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getFeedbackIcon(item.type)}
                <div>
                  <h3 className="font-medium text-white">{item.subject}</h3>
                  <p className="text-sm text-gray-400">{new Date(item.createdAt.toDate()).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>

            <p className="text-gray-300">{item.description}</p>

            {item.response && (
              <div className="bg-gray-700 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-blue-400">Admin Response:</p>
                <p className="text-white mt-2">{item.response}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Responded on: {item.resolvedAt ? new Date(item.resolvedAt.toDate()).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Priority: {item.priority}</span>
            </div>
          </div>
        ))}

        {feedback.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FaComments className="mx-auto text-4xl text-gray-600 mb-4" />
            <p className="text-gray-400">No feedback submitted yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 