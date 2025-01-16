import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';

export async function POST(request: Request) {
  try {
    const { spotId, isAvailable } = await request.json();

    if (!spotId) {
      return NextResponse.json(
        { error: 'Spot ID is required' },
        { status: 400 }
      );
    }

    const spotRef = doc(db, 'parkingSpots', spotId);
    await updateDoc(spotRef, {
      isAvailable,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(
      { message: 'Spot availability updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating spot availability:', error);
    return NextResponse.json(
      { error: 'Failed to update spot availability' },
      { status: 500 }
    );
  }
} 