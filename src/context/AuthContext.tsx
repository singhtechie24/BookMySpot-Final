'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase-client';
import { User } from '@/services/userService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUserContext: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUserContext: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Subscribe to real-time updates of user data
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser({
              id: doc.id,
              email: userData.email,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              phoneNumber: userData.phoneNumber,
              address: userData.address,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              role: userData.role,
              firebaseUser,
            });
          }
          setLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateUserContext = (updatedUser: User) => {
    // Ensure dates are properly handled
    const processedUser = {
      ...updatedUser,
      createdAt: updatedUser.createdAt instanceof Date ? updatedUser.createdAt : new Date(updatedUser.createdAt),
      updatedAt: updatedUser.updatedAt instanceof Date ? updatedUser.updatedAt : new Date(updatedUser.updatedAt || Date.now())
    };
    setUser(processedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 