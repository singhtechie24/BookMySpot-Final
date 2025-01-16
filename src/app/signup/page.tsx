'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UserService } from '@/services/userService';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'regular' | 'space_owner'>('regular');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      console.log('Selected user type:', userType); // Debug log
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await UserService.createUser(user.uid, {
        email: user.email || '',
        role: userType === 'space_owner' ? 'space_owner' : 'user',
        type: userType,
      });

      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setError(error instanceof FirebaseError ? error.message : 'An error occurred during signup');
    }
  };

  const handleGoogleSignup = async () => {
    try {
      console.log('Selected user type for Google signup:', userType);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await UserService.createUser(user.uid, {
        email: user.email || '',
        role: userType === 'space_owner' ? 'space_owner' : 'user',
        type: userType,
        name: user.displayName || undefined,
      });

      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Google signup error:', error);
      setError(error instanceof FirebaseError ? error.message : 'An error occurred during Google signup');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Map Background */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700/50 to-gray-900/50" />
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15057.534307180755!2d-97.75!3d30.25!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus"
          className="w-full h-full"
          style={{ filter: 'grayscale(1)' }}
          loading="lazy"
        />
      </div>

      {/* Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-black px-8 md:px-20 py-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Sign up</h2>
            <p className="text-gray-400">Sign up for free to access to in any of our products</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleEmailSignup}>
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">I want to</label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <button
                    type="button"
                    className={`px-4 py-3 rounded-lg border ${
                      userType === 'regular'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                    onClick={() => setUserType('regular')}
                  >
                    Find Parking
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-3 rounded-lg border ${
                      userType === 'space_owner'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                    onClick={() => setUserType('space_owner')}
                  >
                    List My Spot
                  </button>
                </div>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-600'}`}>
                      {password.length >= 6 && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${password.length >= 6 ? 'text-green-500' : 'text-gray-400'}`}>
                      At least 6 Characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-600'}`}>
                      {/[A-Z]/.test(password) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                      At least 1 upper case letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-600'}`}>
                      {/[a-z]/.test(password) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                      At least 1 lower case letter (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-600'}`}>
                      {/[0-9]/.test(password) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                      At least 1 Number (0-9)
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Sign Up
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">Or</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleGoogleSignup}
              className="flex items-center justify-center w-full px-4 py-3 border border-gray-800 rounded-lg text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Image
                src="/google.svg"
                alt="Google"
                width={20}
                height={20}
                className="mr-2"
              />
              Continue with Google
            </button>
          </div>

          <div className="mt-8 text-center text-gray-400">
            <p>
              Already a member?{' '}
              <Link href="/login" className="text-blue-500 hover:text-blue-400">
                Sign In
              </Link>
            </p>
            <p className="mt-2">
              Are you an admin?{' '}
              <Link href="/admin/login" className="text-blue-500 hover:text-blue-400">
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 