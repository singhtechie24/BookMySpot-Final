import { db } from '@/config/firebase-client';
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, onSnapshot, getDocs, QuerySnapshot, DocumentData, writeBatch, where } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt?: Date;
  role?: 'user' | 'admin' | 'space-owner';
  firebaseUser?: FirebaseUser;
}

export class UserService {
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }
      const userData = userDoc.data();
      console.log('Raw user data from Firestore:', userData);
      
      // Normalize role to use hyphen format
      const role = userData.role?.toLowerCase().replace(/_/g, '-') || 'user';
      
      return {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        role: role as User['role'],
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async createUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const now = new Date();
      const normalizedRole = userData.role?.toLowerCase().replace(/_/g, '-') || 'user';
      const userDataToSave = {
        ...userData,
        createdAt: now,
        updatedAt: now,
        role: normalizedRole,
      };
      console.log('Creating user with data:', userDataToSave);
      await setDoc(doc(db, 'users', userId), userDataToSave);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const normalizedRole = userData.role?.toLowerCase().replace(/_/g, '-');
      const now = new Date();
      const updateData = {
        ...userData,
        ...(normalizedRole && { role: normalizedRole }),
        updatedAt: now,
      };
      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const normalizedRole = data.role?.toLowerCase().replace(/_/g, '-') || 'user';
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: normalizedRole as User['role'],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  static subscribeToUsers(callback: (users: User[]) => void): () => void {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        const normalizedRole = data.role?.toLowerCase().replace(/_/g, '-') || 'user';
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: normalizedRole as User['role'],
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
      callback(users);
    }, (error) => {
      console.error('Error subscribing to users:', error);
    });

    return unsubscribe;
  }

  static async deleteUser(adminId: string, userIdToDelete: string): Promise<void> {
    try {
      // Verify the requester is an admin
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        throw new Error('Unauthorized: Only admins can delete users');
      }

      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', userIdToDelete));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Don't allow deleting other admins
      if (userDoc.data().role === 'admin') {
        throw new Error('Cannot delete admin users');
      }

      // Start a batch write
      const batch = writeBatch(db);

      // Delete user's parking spots if they are a space owner
      if (userDoc.data().role === 'space-owner') {
        const spotsRef = collection(db, 'parkingSpots');
        const spotsQuery = query(spotsRef, where('createdBy', '==', userIdToDelete));
        const spotsSnapshot = await getDocs(spotsQuery);
        spotsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      // Delete user's bookings
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(bookingsRef, where('userId', '==', userIdToDelete));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      bookingsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user document
      batch.delete(doc(db, 'users', userIdToDelete));

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async updateUserRole(userId: string, role: User['role']): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role,
        updatedAt: new Date()
      });
      console.log(`Updated user ${userId} role to ${role}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  static async updateUserRoleFormat(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if (userData.role === 'space_owner') {
        await updateDoc(userRef, {
          role: 'space-owner',
          updatedAt: new Date()
        });
        console.log('Updated user role format from space_owner to space-owner');
      }
    } catch (error) {
      console.error('Error updating user role format:', error);
      throw error;
    }
  }
} 