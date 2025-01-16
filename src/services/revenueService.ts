import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  limit,
  addDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format
} from 'date-fns';

interface RevenueOverview {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  averagePerSpot: number;
  topPerformingSpots: Array<{
    spotId: string;
    spotName: string;
    revenue: number;
  }>;
}

interface MonthlyEarning {
  month: string;
  revenue: number;
  bookings: number;
}

interface Transaction {
  id: string;
  spotId: string;
  spotName: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  bookingId: string;
  userId: string;
  userName: string;
}

export const getRevenueOverview = async (ownerId: string): Promise<RevenueOverview> => {
  try {
    // Get all spots owned by the user
    const spotsQuery = query(
      collection(db, 'parkingSpots'),
      where('ownerId', '==', ownerId)
    );
    const spotsSnapshot = await getDocs(spotsQuery);
    const spotIds = spotsSnapshot.docs.map(doc => doc.id);

    // Initialize default response for no spots
    if (spotIds.length === 0) {
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        averagePerSpot: 0,
        topPerformingSpots: []
      };
    }

    // Get all completed bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('spotId', 'in', spotIds),
      where('paymentStatus', '==', 'completed')
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    const spotRevenues = new Map<string, { revenue: number; name: string }>();

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const amount = booking.totalAmount;
      const date = booking.startTime.toDate();
      
      totalRevenue += amount;
      
      if (date >= monthStart) {
        monthlyRevenue += amount;
      }
      
      if (date >= yearStart) {
        yearlyRevenue += amount;
      }

      // Track revenue per spot
      const currentSpotRevenue = spotRevenues.get(booking.spotId) || { revenue: 0, name: booking.spotName };
      spotRevenues.set(booking.spotId, {
        revenue: currentSpotRevenue.revenue + amount,
        name: booking.spotName
      });
    });

    // Calculate average revenue per spot
    const averagePerSpot = spotIds.length > 0 ? totalRevenue / spotIds.length : 0;

    // Get top performing spots
    const topPerformingSpots = Array.from(spotRevenues.entries())
      .map(([spotId, data]) => ({
        spotId,
        spotName: data.name,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      averagePerSpot,
      topPerformingSpots
    };
  } catch (error) {
    console.error('Error getting revenue overview:', error);
    throw error;
  }
};

export const getMonthlyEarnings = async (ownerId: string, year: number): Promise<MonthlyEarning[]> => {
  try {
    // Get all spots owned by the user
    const spotsQuery = query(
      collection(db, 'parkingSpots'),
      where('ownerId', '==', ownerId)
    );
    const spotsSnapshot = await getDocs(spotsQuery);
    const spotIds = spotsSnapshot.docs.map(doc => doc.id);

    // Get all completed bookings for the year
    const yearStart = startOfYear(new Date(year, 0));
    const yearEnd = endOfYear(new Date(year, 0));
    
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('spotId', 'in', spotIds),
      where('paymentStatus', '==', 'completed'),
      where('startTime', '>=', Timestamp.fromDate(yearStart)),
      where('startTime', '<=', Timestamp.fromDate(yearEnd))
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);

    // Initialize monthly data
    const monthlyData = new Map<string, { revenue: number; bookings: number }>();
    
    // Initialize all months
    eachMonthOfInterval({ start: yearStart, end: yearEnd }).forEach(date => {
      const monthKey = format(date, 'MMM yyyy');
      monthlyData.set(monthKey, { revenue: 0, bookings: 0 });
    });

    // Aggregate booking data by month
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const date = booking.startTime.toDate();
      const monthKey = format(date, 'MMM yyyy');
      
      const currentData = monthlyData.get(monthKey) || { revenue: 0, bookings: 0 };
      monthlyData.set(monthKey, {
        revenue: currentData.revenue + booking.totalAmount,
        bookings: currentData.bookings + 1
      });
    });

    // Convert to array and sort by date
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));
  } catch (error) {
    console.error('Error getting monthly earnings:', error);
    throw error;
  }
};

export const getTransactionHistory = async (
  ownerId: string,
  limit: number = 50,
  startAfter?: Date
): Promise<Transaction[]> => {
  try {
    // Get all spots owned by the user
    const spotsQuery = query(
      collection(db, 'parkingSpots'),
      where('createdBy', '==', ownerId)
    );
    const spotsSnapshot = await getDocs(spotsQuery);
    const spotIds = spotsSnapshot.docs.map(doc => doc.id);

    // Build query for transactions
    let transactionsQuery = query(
      collection(db, 'bookings'),
      where('spotId', 'in', spotIds),
      orderBy('startTime', 'desc')
    );

    if (startAfter) {
      transactionsQuery = query(
        transactionsQuery,
        where('startTime', '<', Timestamp.fromDate(startAfter))
      );
    }

    transactionsQuery = query(transactionsQuery, limit(limit));
    
    const transactionsSnapshot = await getDocs(transactionsQuery);

    return transactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        spotId: data.spotId,
        spotName: data.spotName,
        amount: data.totalAmount,
        date: data.startTime.toDate(),
        status: data.paymentStatus,
        bookingId: doc.id,
        userId: data.userId,
        userName: data.userName
      };
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
};

export const generateRevenueReport = async (
  ownerId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    // Get all spots owned by the user
    const spotsQuery = query(
      collection(db, 'parkingSpots'),
      where('createdBy', '==', ownerId)
    );
    const spotsSnapshot = await getDocs(spotsQuery);
    const spotIds = spotsSnapshot.docs.map(doc => doc.id);

    // Get all bookings within date range
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('spotId', 'in', spotIds),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime', 'asc')
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);

    // Aggregate data for report
    const reportData = {
      totalRevenue: 0,
      totalBookings: bookingsSnapshot.size,
      completedBookings: 0,
      cancelledBookings: 0,
      averageBookingValue: 0,
      spotPerformance: new Map<string, {
        revenue: number;
        bookings: number;
        name: string;
      }>()
    };

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      
      if (booking.paymentStatus === 'completed') {
        reportData.totalRevenue += booking.totalAmount;
        reportData.completedBookings++;
      } else if (booking.bookingStatus === 'cancelled') {
        reportData.cancelledBookings++;
      }

      // Track spot performance
      const spotData = reportData.spotPerformance.get(booking.spotId) || {
        revenue: 0,
        bookings: 0,
        name: booking.spotName
      };
      
      reportData.spotPerformance.set(booking.spotId, {
        revenue: spotData.revenue + (booking.paymentStatus === 'completed' ? booking.totalAmount : 0),
        bookings: spotData.bookings + 1,
        name: booking.spotName
      });
    });

    // Calculate average booking value
    reportData.averageBookingValue = reportData.completedBookings > 0
      ? reportData.totalRevenue / reportData.completedBookings
      : 0;

    return {
      ...reportData,
      spotPerformance: Array.from(reportData.spotPerformance.entries()).map(([spotId, data]) => ({
        spotId,
        ...data
      })),
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  } catch (error) {
    console.error('Error generating revenue report:', error);
    throw error;
  }
};

export async function calculateAndStoreRevenue() {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query completed bookings from the last 24 hours
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('status', '==', 'completed'),
      where('endTime', '>=', Timestamp.fromDate(today))
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    let totalRevenue = 0;
    let platformFees = 0;

    // Calculate revenue from bookings
    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      totalRevenue += booking.totalAmount || 0;
      // Calculate platform fee (10% of total amount)
      platformFees += (booking.totalAmount || 0) * 0.1;
    });

    // Store revenue data
    if (totalRevenue > 0) {
      await addDoc(collection(db, 'revenue'), {
        date: Timestamp.fromDate(today),
        totalRevenue,
        platformFees,
        bookingCount: bookingsSnapshot.size,
        createdAt: Timestamp.now()
      });
    }

    return { totalRevenue, platformFees, bookingCount: bookingsSnapshot.size };
  } catch (error) {
    console.error('Error calculating revenue:', error);
    throw error;
  }
} 