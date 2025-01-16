import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ParkingSpot, ParkingSpotRequest } from '@/types/parkingSpot';
import { createParkingRequestNotification } from './notificationService';

export const updateSpotAvailability = async (
  userId: string,
  spotId: string,
  newAvailability: 'available' | 'unavailable'
) => {
  try {
    // Get spot document first
    const spotRef = doc(db, 'parkingSpots', spotId);
    const spotSnap = await getDoc(spotRef);
    
    if (!spotSnap.exists()) {
      throw new Error('Spot not found');
    }
    
    const spotData = spotSnap.data();
    
    // Verify ownership
    if (spotData.ownerId !== userId) {
      throw new Error('Unauthorized: You do not own this spot');
    }

    // Update the spot's availability
    await updateDoc(spotRef, {
      availability: newAvailability,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating spot availability:', error);
    throw error;
  }
};

// Function to subscribe to all parking spots (admin only)
export const subscribeToAllParkingSpots = (
  callback: (spots: ParkingSpot[]) => void
) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  const spotsRef = collection(db, 'parkingSpots');
  const q = query(spotsRef);

  return onSnapshot(q, (snapshot) => {
    const spots = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      description: doc.data().description || '',
      imageUrl: doc.data().imageUrl || '',
      address: doc.data().address || '',
      city: doc.data().city || '',
      pricePerHour: doc.data().pricePerHour || 0,
      availability: doc.data().availability || 'unavailable',
      days: doc.data().days || [],
      timeSlots: doc.data().timeSlots || [],
      ownerId: doc.data().ownerId || '',
      location: doc.data().location,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      status: doc.data().status || 'pending',
      totalRevenue: doc.data().totalRevenue || 0,
      totalBookings: doc.data().totalBookings || 0
    })) as ParkingSpot[];
    
    callback(spots);
  });
};

// Function to get admin pending requests
export const getAdminPendingRequests = async (adminId: string): Promise<ParkingSpotRequest[]> => {
  try {
    // Verify user is admin
    const userDoc = await getDoc(doc(db, 'users', adminId));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Only admins can view pending requests');
    }

    const requestsRef = collection(db, 'parkingSpotRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    
    console.log('Found pending requests:', snapshot.docs.length); // Debug log

    return Promise.all(snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      console.log('Processing request:', data); // Debug log

      // Get owner's email
      const ownerDoc = await getDoc(doc(db, 'users', data.ownerId));
      const ownerEmail = ownerDoc.exists() ? ownerDoc.data().email : 'Unknown';
      
      if (data.type === 'edit_spot') {
        console.log('Processing edit request:', data); // Debug log
        return {
          id: docSnapshot.id,
          type: 'edit_spot',
          ownerId: data.ownerId,
          ownerEmail,
          spotId: data.spotId,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          expiresAt: data.createdAt?.toDate(), // Set to same as created date
          currentSpotData: data.currentSpotData,
          requestedSpotData: data.requestedSpotData,
          spotName: data.currentSpotData?.name || 'Unknown Spot',
          // Required fields from ParkingSpotRequest
          address: data.currentSpotData?.address || '',
          description: data.currentSpotData?.description || '',
          pricePerHour: data.currentSpotData?.pricePerHour || 0,
          imageUrl: data.currentSpotData?.imageUrl || ''
        } as ParkingSpotRequest;
      }
      
      if (data.type === 'availability_update' && data.spotId) {
        console.log('Processing availability update request:', data); // Debug log
        const spotRef = doc(db, 'parkingSpots', data.spotId);
        const spotDoc = await getDoc(spotRef);
        const spotData = spotDoc.data();
        
        return {
          id: docSnapshot.id,
          type: 'availability_update',
          ownerId: data.ownerId,
          ownerEmail,
          spotName: spotData?.name || 'Unknown Spot',
          address: spotData?.address || '',
          description: `Request to change availability from ${data.currentAvailability} to ${data.requestedAvailability}`,
          pricePerHour: spotData?.pricePerHour || 0,
          imageUrl: spotData?.imageUrl || '',
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          expiresAt: data.createdAt?.toDate(), // Set to same as created date
          currentAvailability: data.currentAvailability,
          requestedAvailability: data.requestedAvailability,
          spotId: data.spotId
        } as ParkingSpotRequest;
      }
      
      // For new spot requests
      console.log('Processing new spot request:', data); // Debug log
      return {
        id: docSnapshot.id,
        type: 'new_spot',
        ownerId: data.ownerId,
        ownerEmail,
        spotName: data.name || '',
        address: data.address || '',
        description: data.description || '',
        pricePerHour: data.pricePerHour || 0,
        imageUrl: data.imageUrl || '',
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.createdAt?.toDate(), // Set to same as created date
        city: data.city || '',
        days: data.days || [],
        timeSlots: data.timeSlots || []
      } as ParkingSpotRequest;
    }));
  } catch (error) {
    console.error('Error getting admin pending requests:', error);
    throw error;
  }
};

// Function for space owners to view their requests
export const getSpaceOwnerRequests = async (userId: string): Promise<ParkingSpotRequest[]> => {
  try {
    // Verify user exists and is a space owner
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    if (userDoc.data().role !== 'space-owner') {
      throw new Error('Unauthorized: Only space owners can view their requests');
    }

    const requestsRef = collection(db, 'parkingSpotRequests');
    const q = query(
      requestsRef,
      where('ownerId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ownerId: doc.data().ownerId,
      spotName: doc.data().name,
      address: doc.data().address || '',
      description: doc.data().description || '',
      pricePerHour: doc.data().pricePerHour || 0,
      imageUrl: doc.data().imageUrl || '',
      status: doc.data().status || 'pending',
      createdAt: doc.data().createdAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
      rejectionReason: doc.data().rejectionReason
    })) as ParkingSpotRequest[];
  } catch (error) {
    console.error('Error getting space owner requests:', error);
    throw error;
  }
};

// Function to request spot edit (space owner only)
export const requestSpotEdit = async (
  userId: string,
  spotId: string,
  updatedData: {
    name: string;
    description: string;
    address: string;
    city: string;
    pricePerHour: number;
    imageUrl?: string;
    days: string[];
    timeSlots: { start: string; end: string; }[];
  }
) => {
  try {
    console.log('Starting spot edit request:', { userId, spotId });
    
    // Get user document to verify role
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    console.log('User data:', userData);
    
    if (userData.role !== 'space-owner') {
      throw new Error('Unauthorized: Only space owners can request spot edits');
    }

    // Get current spot data
    const spotRef = doc(db, 'parkingSpots', spotId);
    const spotSnap = await getDoc(spotRef);
    
    if (!spotSnap.exists()) {
      throw new Error('Spot not found');
    }
    
    const spotData = spotSnap.data();
    console.log('Current spot data:', spotData);
    
    // Verify ownership
    if (spotData.ownerId !== userId) {
      throw new Error('Unauthorized: You do not own this spot');
    }

    // Create edit request
    const requestData = {
      type: 'edit_spot',
      spotId: spotId,
      ownerId: userId,
      status: 'pending',
      createdAt: serverTimestamp(),
      currentSpotData: {
        name: spotData.name,
        description: spotData.description,
        address: spotData.address,
        city: spotData.city,
        pricePerHour: spotData.pricePerHour,
        imageUrl: spotData.imageUrl,
        days: spotData.days || [],
        timeSlots: spotData.timeSlots || []
      },
      requestedSpotData: updatedData
    };
    
    console.log('Creating edit request with data:', requestData);
    
    const requestRef = collection(db, 'parkingSpotRequests');
    await addDoc(requestRef, requestData);
    console.log('Edit request created successfully');

    return true;
  } catch (error) {
    console.error('Error requesting spot edit:', error);
    throw error;
  }
};

// Function to approve a parking spot request (admin only)
export const approveParkingSpotRequest = async (adminId: string, requestId: string) => {
  try {
    // Verify user is admin
    const userDoc = await getDoc(doc(db, 'users', adminId));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Only admins can approve requests');
    }

    // Get the request document
    const requestRef = doc(db, 'parkingSpotRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const requestData = requestDoc.data();

    if (requestData.type === 'availability_update') {
      // Handle availability update request
      const spotRef = doc(db, 'parkingSpots', requestData.spotId);
      await updateDoc(spotRef, {
        availability: requestData.requestedAvailability,
        updatedAt: serverTimestamp()
      });
    } else if (requestData.type === 'edit_spot') {
      // Handle spot edit request
      const spotRef = doc(db, 'parkingSpots', requestData.spotId);
      await updateDoc(spotRef, {
        ...requestData.requestedSpotData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Handle new spot request
      const newSpot = {
        name: requestData.name,
        description: requestData.description || '',
        address: requestData.address,
        city: requestData.city,
        pricePerHour: requestData.pricePerHour,
        imageUrl: requestData.imageUrl,
        days: requestData.days || [],
        timeSlots: requestData.timeSlots || [],
        status: 'approved',
        availability: 'available',
        ownerId: requestData.ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'parking_spot'
      };

      await addDoc(collection(db, 'parkingSpots'), newSpot);
    }

    // Update request status
    await updateDoc(requestRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp()
    });

    // Create notification for the space owner
    let notificationMessage = '';
    if (requestData.type === 'availability_update') {
      notificationMessage = 'Availability update request';
    } else if (requestData.type === 'edit_spot') {
      notificationMessage = `Edit request for ${requestData.currentSpotData.name}`;
    } else {
      notificationMessage = requestData.name;
    }
    await createParkingRequestNotification(requestData.ownerId, notificationMessage);

    return true;
  } catch (error) {
    console.error('Error approving parking spot request:', error);
    throw error;
  }
};

// Function to reject a parking spot request (admin only)
export const rejectParkingSpotRequest = async (adminId: string, requestId: string, rejectionReason: string) => {
  try {
    // Verify user is admin
    const userDoc = await getDoc(doc(db, 'users', adminId));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      throw new Error('Unauthorized: Only admins can reject requests');
    }

    const requestRef = doc(db, 'parkingSpotRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const requestData = requestDoc.data();

    // Update the request status
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectionReason,
      reviewedBy: adminId,
      reviewedAt: serverTimestamp()
    });

    // Create notification for the space owner
    await createParkingRequestNotification(requestData.ownerId, requestData.name);

    return true;
  } catch (error) {
    console.error('Error rejecting parking spot request:', error);
    throw error;
  }
};

// Function to delete a parking spot (admin only)
export const deleteParkingSpot = async (spotId: string) => {
  try {
    // Get the spot document reference
    const spotRef = doc(db, 'parkingSpots', spotId);
    
    // Delete the spot
    await deleteDoc(spotRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    throw error;
  }
};

// Function to update a parking spot
export const updateParkingSpot = async (spotId: string, updateData: Partial<ParkingSpot>) => {
  try {
    const spotRef = doc(db, 'parkingSpots', spotId);
    
    await updateDoc(spotRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating parking spot:', error);
    throw error;
  }
};

// ... rest of the file 