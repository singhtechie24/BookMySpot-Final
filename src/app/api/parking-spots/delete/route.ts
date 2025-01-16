import { NextResponse } from 'next/server';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';

export async function DELETE(request: Request) {
  try {
    const { spotId } = await request.json();

    if (!spotId) {
      return NextResponse.json(
        { error: 'Spot ID is required' },
        { status: 400 }
      );
    }

    const spotRef = doc(db, 'parkingSpots', spotId);
    await deleteDoc(spotRef);

    return NextResponse.json(
      { message: 'Parking spot deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    return NextResponse.json(
      { error: 'Failed to delete parking spot' },
      { status: 500 }
    );
  }
} 