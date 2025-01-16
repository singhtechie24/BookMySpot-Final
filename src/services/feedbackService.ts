import { 
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { Feedback, FeedbackStatus, FeedbackTarget } from '@/types/feedback';

export class FeedbackService {
  private static COLLECTION = 'feedback';

  static async createFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      const feedbackData = {
        ...feedback,
        status: 'pending' as FeedbackStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), feedbackData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  static async updateFeedback(feedbackId: string, updates: Partial<Feedback>): Promise<void> {
    try {
      const feedbackRef = doc(db, this.COLLECTION, feedbackId);
      await updateDoc(feedbackRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  static async getFeedback(feedbackId: string): Promise<Feedback | null> {
    try {
      const feedbackRef = doc(db, this.COLLECTION, feedbackId);
      const feedbackDoc = await getDoc(feedbackRef);
      
      if (!feedbackDoc.exists()) {
        return null;
      }

      return {
        id: feedbackDoc.id,
        ...feedbackDoc.data()
      } as Feedback;
    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  }

  static async getUserFeedback(userId: string): Promise<Feedback[]> {
    try {
      const feedbackQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(feedbackQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Feedback));
    } catch (error) {
      console.error('Error getting user feedback:', error);
      throw error;
    }
  }

  static async getSpaceOwnerFeedback(spaceOwnerId: string): Promise<Feedback[]> {
    try {
      const feedbackQuery = query(
        collection(db, this.COLLECTION),
        where('spaceOwnerId', '==', spaceOwnerId),
        where('target', '==', 'space-owner' as FeedbackTarget),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(feedbackQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Feedback));
    } catch (error) {
      console.error('Error getting space owner feedback:', error);
      throw error;
    }
  }

  static async getAdminFeedback(): Promise<Feedback[]> {
    try {
      const feedbackQuery = query(
        collection(db, this.COLLECTION),
        where('target', '==', 'admin' as FeedbackTarget),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(feedbackQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Feedback));
    } catch (error) {
      console.error('Error getting admin feedback:', error);
      throw error;
    }
  }

  static async respondToFeedback(
    feedbackId: string,
    response: string,
    status: FeedbackStatus,
    responderId: string
  ): Promise<void> {
    try {
      const feedbackRef = doc(db, this.COLLECTION, feedbackId);
      await updateDoc(feedbackRef, {
        response,
        status,
        assignedTo: responderId,
        resolvedAt: status === 'resolved' ? Timestamp.now() : null,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error responding to feedback:', error);
      throw error;
    }
  }
} 