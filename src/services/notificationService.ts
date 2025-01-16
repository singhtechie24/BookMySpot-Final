import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { Notification as BaseNotification, NotificationStatus, NotificationAction } from '@/types/notification';

export interface Notification extends BaseNotification {
  notificationType: 'request' | 'approval' | 'rejection' | 'booking' | 'default';
}

export type { NotificationStatus, NotificationAction };

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  try {
    const notificationData = {
      ...notification,
      createdAt: new Date(),
      status: notification.status || 'unread' as const
    };
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        message: data.message || '',
        userId: data.userId,
        status: (data.status || 'unread') as NotificationStatus,
        createdAt: data.createdAt?.toDate() || new Date(),
        action: data.action || null
      } as Notification;
    });
    
    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
  });
};

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { status: 'read' as NotificationStatus });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('status', '==', 'unread'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { status: 'read' as NotificationStatus });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export const createBookingNotification = async (userId: string, spotName: string) => {
  const notification = {
    userId,
    title: 'New Booking',
    message: `New booking received for ${spotName}`,
    status: 'unread' as const,
    notificationType: 'booking' as const,
    action: {
      type: 'view' as const,
      link: '/dashboard/bookings'
    }
  };
  return createNotification(notification);
};

export const createPaymentNotification = async (userId: string, spotName: string, amount: number) => {
  const notification = {
    userId,
    title: 'Payment Received',
    message: `Payment of £${amount.toFixed(2)} received for ${spotName}`,
    status: 'unread' as const,
    notificationType: 'booking' as const,
    action: {
      type: 'view' as const,
      link: '/dashboard/bookings'
    }
  };
  return createNotification(notification);
};

export const createSpotStatusNotification = async (userId: string, spotName: string, status: string) => {
  const notification = {
    userId,
    title: 'Spot Status Update',
    message: `Your parking spot ${spotName} is now ${status}`,
    status: 'unread' as const,
    notificationType: 'default' as const,
    action: {
      type: 'view' as const,
      link: '/dashboard/my-spots'
    }
  };
  return createNotification(notification);
};

export const createSpotApprovalNotification = async (userId: string, spotName: string, approved: boolean) => {
  const notification = {
    userId,
    title: approved ? 'Spot Request Approved' : 'Spot Request Rejected',
    message: approved 
      ? `Your request for spot ${spotName} has been approved` 
      : `Your request for spot ${spotName} has been rejected`,
    status: 'unread' as const,
    notificationType: approved ? 'approval' as const : 'rejection' as const,
    action: {
      type: 'view' as const,
      link: '/dashboard/my-requests'
    }
  };
  return createNotification(notification);
};

export const createSpotRequestNotification = async (userId: string, spotName: string) => {
  const notification = {
    userId,
    title: 'New Spot Request',
    message: `New request for spot ${spotName}`,
    status: 'unread' as const,
    notificationType: 'request' as const,
    action: {
      type: 'approve' as const,
      link: '/dashboard/requests'
    }
  };
  return createNotification(notification);
};

export const createParkingRequestNotification = async (ownerId: string, spotName: string) => {
  try {
    // Get all admin users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const adminSnapshot = await getDocs(q);
    
    // Create notifications for each admin
    const batch = writeBatch(db);
    adminSnapshot.docs.forEach(adminDoc => {
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        userId: adminDoc.id,
        title: 'New Parking Spot Request',
        message: `A space owner has submitted a new request for parking spot: ${spotName}`,
        status: 'unread',
        notificationType: 'request',
        createdAt: new Date(),
        action: {
          type: 'view',
          link: '/dashboard/requests'
        }
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error creating admin notifications:', error);
    throw error;
  }
}; 