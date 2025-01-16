import { NextResponse } from 'next/server';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Get user profile
export async function GET(request: Request) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get profile' },
      { status: 400 }
    );
  }
}

// Update user profile
export async function PUT(request: Request) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const userRef = doc(db, 'users', user.uid);
    
    // Remove sensitive fields that shouldn't be updated
    const { uid, email, role, createdAt, ...updateData } = data;

    await updateDoc(userRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 400 }
    );
  }
} 