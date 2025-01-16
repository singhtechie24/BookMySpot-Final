import { config } from 'dotenv';
config();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = '0qejU46CLIcetYo34Keq6uAGup82';
const USER_EMAIL = 'spaceowner@bookmyspot.com';

async function updateUserRole() {
  try {
    const userRef = doc(db, 'users', USER_ID);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create the user document if it doesn't exist
      await setDoc(userRef, {
        email: USER_EMAIL,
        role: 'space_owner',
        type: 'space_owner',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('User document created with space_owner role');
    } else {
      // Update existing document
      await updateDoc(userRef, {
        role: 'space_owner',
        type: 'space_owner',
        updatedAt: Timestamp.now()
      });
      console.log('User role updated successfully to space_owner');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    process.exit();
  }
}

updateUserRole(); 