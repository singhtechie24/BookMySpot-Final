import '@testing-library/jest-dom';

// Mock Firebase configuration
const mockApp = {
  name: '[DEFAULT]',
  options: {
    projectId: 'test-project',
    storageBucket: 'test-bucket.appspot.com'
  }
};

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    };
  },
  usePathname() {
    return '';
  }
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => [mockApp]),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
    app: mockApp
  })),
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
  signInWithPopup: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    app: mockApp
  })),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    app: mockApp
  })),
})); 