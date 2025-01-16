'use client';

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { auth } from '@/config/firebase';
import { useEffect, useState } from "react";
import Image from 'next/image';

function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="BookMySpot Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8" 
            />
            <span className="font-bold text-xl">BookMySpot</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-blue-500">Home</Link>
            <Link href="#" className="hover:text-blue-500">Service</Link>
            <Link href="#" className="hover:text-blue-500">Features</Link>
            <Link href="#" className="hover:text-blue-500">Product</Link>
            <Link href="#" className="hover:text-blue-500">Testimonial</Link>
            <Link href="#" className="hover:text-blue-500">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 text-blue-500 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-orange-500 hover:text-orange-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="px-4 py-2 text-orange-500 hover:text-orange-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      {mounted ? (
        <>
          {!isDashboard && <Navbar />}
          {children}
        </>
      ) : null}
    </AuthProvider>
  );
} 