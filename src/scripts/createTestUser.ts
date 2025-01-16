import { config } from 'dotenv';
config();

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_USER_EMAIL = 'spaceowner@bookmyspot.com';
const TEST_USER_PASSWORD = 'test123';

async function createTestUser() {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD
    );

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: TEST_USER_EMAIL,
      role: 'space_owner',
      type: 'space_owner',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    console.log('Test space owner created successfully:');
    console.log('Email:', TEST_USER_EMAIL);
    console.log('Password:', TEST_USER_PASSWORD);
    console.log('UID:', userCredential.user.uid);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit();
  }
}

createTestUser(); 