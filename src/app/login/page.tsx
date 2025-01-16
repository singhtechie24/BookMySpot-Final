'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Attempting login with:', { email }); // Debug log
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user); // Debug log
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else {
        setError(error.message || 'An error occurred during login.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      console.log('Attempting Google login'); // Debug log
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google login successful:', result.user); // Debug log
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'An error occurred during Google login.');
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

      {/* Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-black px-8 md:px-20 py-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-gray-400">Sign in for free to access to in any of our service</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
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
                <label className="text-white text-sm font-medium mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end mt-1">
                  <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-blue-500">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Sign In
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
              onClick={handleGoogleLogin}
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

          <p className="mt-8 text-center text-gray-400">
            Not a member?{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-400">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 