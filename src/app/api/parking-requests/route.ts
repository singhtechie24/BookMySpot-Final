import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { Timestamp, doc, collection, addDoc, updateDoc, deleteDoc } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating new parking request');
    const data = await request.json();
    console.log('Received data:', data);

    // Validate required fields
    const requiredFields = ['name', 'location', 'price', 'availableDays', 'availableTime', 'createdBy', 'ownerEmail'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate price
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      console.error('Invalid price:', data.price);
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Validate available days
    if (!Array.isArray(data.availableDays) || data.availableDays.length === 0) {
      console.error('Invalid available days:', data.availableDays);
      return NextResponse.json(
        { error: 'At least one available day must be selected' },
        { status: 400 }
      );
    }

    const parkingRequest = {
      name: data.name,
      location: data.location,
      price,
      description: data.description || '',
      availableDays: data.availableDays,
      availableTime: data.availableTime,
      imageUrl: data.imageUrl || '',
      status: 'pending',
      createdBy: data.createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ownerEmail: data.ownerEmail
    };

    console.log('Creating parking request with data:', parkingRequest);
    const docRef = await adminDb.collection('parkingRequests').add(parkingRequest);
    console.log('Created parking request with ID:', docRef.id);

    return NextResponse.json({ id: docRef.id, ...parkingRequest });
  } catch (error) {
    console.error('Error creating parking request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create parking request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    console.log('Fetching parking requests with filters:', { userId, status });

    let queryRef = adminDb.collection('parkingRequests');
    
    if (userId) {
      queryRef = queryRef.where('createdBy', '==', userId);
    }
    if (status) {
      queryRef = queryRef.where('status', '==', status);
    }

    const snapshot = await queryRef.get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Found', requests.length, 'parking requests');
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching parking requests:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch parking requests' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Updating parking request');
    const data = await request.json();
    const { requestId, status } = data;

    if (!requestId || !status) {
      console.error('Missing required fields:', { requestId, status });
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    const requestRef = adminDb.collection('parkingRequests').doc(requestId);
    const updateData = {
      status,
      updatedAt: Timestamp.now()
    };

    console.log('Updating request', requestId, 'with status:', status);
    await requestRef.update(updateData);

    if (status === 'approved') {
      console.log('Request approved, creating parking spot');
      const requestDoc = await requestRef.get();
      const requestData = requestDoc.data();
      
      if (!requestData) {
        throw new Error('Request data not found');
      }

      console.log('Creating parking spot from request data:', requestData);
      const parkingSpotData = {
        name: requestData.name,
        location: requestData.location,
        price: requestData.price,
        description: requestData.description || '',
        imageUrl: requestData.imageUrl || '',
        isAvailable: true,
        createdBy: requestData.createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        availableDays: requestData.availableDays || [],
        availableTime: requestData.availableTime || '',
      };
      
      const spotRef = await adminDb.collection('parkingSpots').add(parkingSpotData);
      console.log('Created parking spot with ID:', spotRef.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating parking request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update parking request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      console.error('Missing request ID');
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting parking request:', requestId);
    await adminDb.collection('parkingRequests').doc(requestId).delete();
    console.log('Successfully deleted parking request:', requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting parking request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete parking request' },
      { status: 500 }
    );
  }
} 