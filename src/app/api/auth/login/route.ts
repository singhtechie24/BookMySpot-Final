import { NextResponse } from 'next/server';
import { auth, db } from '@/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Sign in user with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    return NextResponse.json({
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        role: userData?.role,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 400 }
    );
  }
} 