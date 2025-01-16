export type BookingStatus = 'active' | 'expired' | 'upcoming' | 'cancelled';

export interface Booking {
  id: string;
  spotId: string;
  userId: string;
  ownerId: string;
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingStatus: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  spotName: string;
} 