'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase-client';
import { toast } from 'react-hot-toast';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      router.push('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (loading) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="BookMySpot"
              width={40}
              height={40}
              className="w-10 group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              BookMySpot
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              <Link 
                href="/dashboard" 
                className="text-gray-300 hover:text-white transition-all hover:translate-y-[-2px] font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white transition-all hover:translate-y-[-2px] font-medium"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div 
            className={`md:hidden transition-all duration-300 ease-in-out ${
              isMenuOpen 
                ? 'max-h-48 opacity-100 visible'
                : 'max-h-0 opacity-0 invisible'
            }`}
          >
            <div className="py-3 space-y-3 border-t border-gray-800">
              <Link 
                href="/dashboard" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 