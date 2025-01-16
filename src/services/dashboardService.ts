import { db } from '@/config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  startOfMonth,
  endOfMonth
} from 'firebase/firestore';

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
  revenueBySpotType: {
    type: string;
    revenue: number;
  }[];
  averageBookingValue: number;
  topPerformingSpots: {
    spotId: string;
    spotName: string;
    revenue: number;
    bookingsCount: number;
  }[];
}

export interface DashboardStats {
  totalSpots: number;
  totalUsers: number;
  activeBookings: number;
  pendingRequests: number;
  revenueStats: RevenueData;
  recentActivity: Array<{
    type: 'booking' | 'request' | 'user' | 'spot';
    title: string;
    description: string;
    timestamp: Date;
  }>;
}

export const getRevenueStats = async (): Promise<RevenueData> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const now = new Date();
    const last12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Get all completed bookings from the last 12 months
    const bookingsQuery = query(
      bookingsRef,
      where('paymentStatus', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(last12Months)),
      orderBy('createdAt', 'desc')
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    }));

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.price || 0), 0);

    // Calculate monthly revenue
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthBookings = bookings.filter(booking => {
        const bookingMonth = booking.createdAt.getMonth();
        const bookingYear = booking.createdAt.getFullYear();
        return bookingMonth === month.getMonth() && bookingYear === month.getFullYear();
      });
      return {
        month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthBookings.reduce((sum, booking) => sum + (booking.price || 0), 0)
      };
    }).reverse();

    // Calculate revenue by spot type
    const spotTypes = new Map<string, number>();
    for (const booking of bookings) {
      const type = booking.spotType || 'unknown';
      spotTypes.set(type, (spotTypes.get(type) || 0) + (booking.price || 0));
    }
    const revenueBySpotType = Array.from(spotTypes.entries()).map(([type, revenue]) => ({
      type,
      revenue
    }));

    // Calculate average booking value
    const averageBookingValue = totalRevenue / bookings.length || 0;

    // Get top performing spots
    const spotPerformance = new Map<string, { revenue: number; bookingsCount: number; spotName: string }>();
    for (const booking of bookings) {
      if (!spotPerformance.has(booking.spotId)) {
        spotPerformance.set(booking.spotId, {
          revenue: 0,
          bookingsCount: 0,
          spotName: booking.spotName || 'Unknown Spot'
        });
      }
      const spot = spotPerformance.get(booking.spotId)!;
      spot.revenue += booking.price || 0;
      spot.bookingsCount += 1;
    }

    const topPerformingSpots = Array.from(spotPerformance.entries())
      .map(([spotId, data]) => ({
        spotId,
        spotName: data.spotName,
        revenue: data.revenue,
        bookingsCount: data.bookingsCount
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      monthlyRevenue,
      revenueBySpotType,
      averageBookingValue,
      topPerformingSpots
    };
  } catch (error) {
    console.error('Error calculating revenue stats:', error);
    throw error;
  }
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total spots
    const spotsQuery = query(collection(db, 'parkingSpots'));
    const spotsSnapshot = await getDocs(spotsQuery);
    const totalSpots = spotsSnapshot.size;

    // Get total users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;

    // Get active bookings (bookings that are currently ongoing)
    const now = Timestamp.now();
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('startTime', '<=', now),
      where('endTime', '>=', now),
      where('status', '==', 'active')
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const activeBookings = bookingsSnapshot.size;

    // Get pending requests
    const requestsQuery = query(
      collection(db, 'parkingSpotRequests'),
      where('status', '==', 'pending')
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    const pendingRequests = requestsSnapshot.size;

    // Get revenue stats
    const revenueStats = await getRevenueStats();

    // Get recent activity
    const recentActivity = await getRecentActivity();

    return {
      totalSpots,
      totalUsers,
      activeBookings,
      pendingRequests,
      revenueStats,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

const getRecentActivity = async (maxItems = 10) => {
  try {
    // Get recent bookings
    const recentBookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const bookingsSnapshot = await getDocs(recentBookingsQuery);

    // Get recent spot requests
    const recentRequestsQuery = query(
      collection(db, 'parkingSpotRequests'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const requestsSnapshot = await getDocs(recentRequestsQuery);

    // Get recent users
    const recentUsersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const usersSnapshot = await getDocs(recentUsersQuery);

    // Get recent spots
    const recentSpotsQuery = query(
      collection(db, 'parkingSpots'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const spotsSnapshot = await getDocs(recentSpotsQuery);

    // Combine and format all activities
    const activities = [
      ...formatBookingActivities(bookingsSnapshot),
      ...formatRequestActivities(requestsSnapshot),
      ...formatUserActivities(usersSnapshot),
      ...formatSpotActivities(spotsSnapshot)
    ];

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

const formatBookingActivities = (snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      type: 'booking' as const,
      title: 'New Booking',
      description: `New booking created for spot ${data.spotName}`,
      timestamp: data.createdAt.toDate()
    };
  });
};

const formatRequestActivities = (snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      type: 'request' as const,
      title: 'New Spot Request',
      description: `New parking spot request: ${data.name}`,
      timestamp: data.createdAt.toDate()
    };
  });
};

const formatUserActivities = (snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      type: 'user' as const,
      title: 'New User',
      description: `New user registered: ${data.email}`,
      timestamp: data.createdAt.toDate()
    };
  });
};

const formatSpotActivities = (snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      type: 'spot' as const,
      title: 'New Parking Spot',
      description: `New parking spot added: ${data.name}`,
      timestamp: data.createdAt.toDate()
    };
  });
}; 