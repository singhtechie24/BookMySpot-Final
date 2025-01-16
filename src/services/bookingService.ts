import { db } from '@/config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { Booking, BookingStatus } from '@/types/booking';

// Function to get bookings for a space owner
export const getOwnerBookings = async (ownerId: string): Promise<Booking[]> => {
  try {
    // Query matches security rules requirements
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('ownerId', '==', ownerId),
      limit(100)
    );
    
    const snapshot = await getDocs(bookingsQuery);
    const bookings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as Booking[];

    // Sort bookings client-side to maintain security rule compliance
    bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Update booking statuses
    return bookings.map(booking => ({
      ...booking,
      bookingStatus: calculateBookingStatus(booking.startTime, booking.endTime, booking.paymentStatus)
    }));
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    throw error;
  }
};

// Function to subscribe to real-time booking updates
export const subscribeToOwnerBookings = (
  ownerId: string,
  callback: (bookings: Booking[]) => void
) => {
  // Query matches security rules requirements
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('ownerId', '==', ownerId),
    limit(100)
  );

  return onSnapshot(bookingsQuery, (snapshot) => {
    const bookings = snapshot.docs.map(doc => {
      const data = doc.data();
      const booking = {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Booking;

      return {
        ...booking,
        bookingStatus: calculateBookingStatus(booking.startTime, booking.endTime, booking.paymentStatus)
      };
    });

    // Sort bookings client-side to maintain security rule compliance
    bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    callback(bookings);
  });
};

// Function to update booking status
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      bookingStatus: status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Helper function to calculate booking status
const calculateBookingStatus = (
  startTime: Date,
  endTime: Date,
  paymentStatus: string
): BookingStatus => {
  const now = new Date();

  if (paymentStatus !== 'completed') {
    return 'cancelled';
  }

  if (now < startTime) {
    return 'upcoming';
  }

  if (now >= startTime && now <= endTime) {
    return 'active';
  }

  return 'expired';
};

// Function to get a single booking by ID
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return null;
    }

    const data = bookingDoc.data();
    const booking = {
      id: bookingDoc.id,
      ...data,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Booking;

    return {
      ...booking,
      bookingStatus: calculateBookingStatus(booking.startTime, booking.endTime, booking.paymentStatus)
    };
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

// Function to update payment status
export const updatePaymentStatus = async (
  bookingId: string,
  paymentStatus: 'pending' | 'completed' | 'failed'
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      paymentStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}; 