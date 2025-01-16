'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaParking, FaClock, FaArrowRight, FaBars, FaTimes } from 'react-icons/fa';
import Footer from '@/components/Footer';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/Logo.png"
                alt="BookMySpot Logo"
                width={40}
                height={40}
                className="w-10 group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                BookMySpot
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="hover:text-[#F2994A] transition-all hover:translate-y-[-2px]">About</Link>
              <Link href="/features" className="hover:text-[#F2994A] transition-all hover:translate-y-[-2px]">Features</Link>
              <Link href="/help" className="hover:text-[#F2994A] transition-all hover:translate-y-[-2px]">Help</Link>
              <div className="flex items-center gap-4">
                <Link href="/login" className="hover:text-orange-500 transition-all hover:translate-y-[-2px]">Login</Link>
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                >
                  Sign Up
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div 
            className={`md:hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen 
                ? 'max-h-64 opacity-100 visible mt-4'
                : 'max-h-0 opacity-0 invisible mt-0'
            }`}
          >
            <div className="flex flex-col space-y-4 pb-4">
              <Link 
                href="/about" 
                className="text-gray-300 hover:text-[#F2994A] transition-colors px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/features" 
                className="text-gray-300 hover:text-[#F2994A] transition-colors px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/help" 
                className="text-gray-300 hover:text-[#F2994A] transition-colors px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Help
              </Link>
              <div className="flex flex-col gap-4 pt-2 border-t border-gray-800">
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-orange-500 transition-colors px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-4 py-2 rounded-lg font-medium text-center shadow-lg shadow-orange-500/20"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="absolute inset-0 z-0 top-40">
          <Image
            src="/images/main.jpg"
            alt="Luxury car with neon effects"
            fill
            className="object-cover opacity-70"
            priority
          />
        </div>
        <div className="relative z-10 max-w-4xl -mt-20 md:-mt-60">
          <h1 className="text-4xl md:text-7xl font-bold mb-4 text-white">
            Effortless Parking
          </h1>
          <h2 className="text-2xl md:text-5xl font-semibold mb-6 text-gray-300">
            Solutions For Urban Life
          </h2>
          <p className="text-base md:text-xl mb-8 text-gray-400 max-w-2xl mx-auto px-4">
            Discover convenient parking options tailored to your needs.
            Join us in transforming the way you park in the city.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-2px]"
            >
              Get Started
            </Link>
            <Link 
              href="/about" 
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 bg-white text-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16 md:mb-20">
            <div className="w-full md:w-1/2">
              <Image
                src="/images/pana.png"
                alt="Interactive Map Feature"
                width={400}
                height={400}
                className="w-full max-w-lg mx-auto"
              />
            </div>
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Effortless Parking: Find Your Spot with Our Interactive Map Feature
              </h3>
              <p className="text-gray-600 mb-6">
                Discover parking spaces near you with our advanced map feature. Easily locate parking spots, check availability in real-time, and reserve your spot. Find a way that works for you and simplify your parking experience.
              </p>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-2px]">
                Learn More
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="text-center mb-16 md:mb-24 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 md:p-12">
            <h3 className="text-xl md:text-2xl font-semibold mb-2">
              Helping a local <span className="text-orange-600 font-bold">Driver</span>
            </h3>
            <p className="text-orange-600 font-semibold mb-8 md:mb-12">
              to find a Parking Space
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
              <div className="group hover:translate-y-[-4px] transition-all">
                <h4 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform">828,867</h4>
                <p className="text-gray-600 font-medium">Monthly Users</p>
              </div>
              <div className="group hover:translate-y-[-4px] transition-all">
                <h4 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform">1,926,436</h4>
                <p className="text-gray-600 font-medium">Parking Spots</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] border border-gray-100 group">
              <Image
                src="/images/image.png"
                alt="Hassle-Free Parking"
                width={300}
                height={200}
                className="w-full rounded-xl mb-6 object-cover h-[200px] group-hover:scale-[1.02] transition-transform"
              />
              <h4 className="text-xl font-bold mb-3">Hassle-Free Parking Solutions</h4>
              <p className="text-gray-600 mb-6">
                Discover personalized parking solutions tailored to your needs. Enjoy real-time availability, secure reservations, and a seamless experience throughout your parking journey.
              </p>
              <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all group-hover:translate-x-1">
                Discover More <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] border border-gray-100 group">
              <Image
                src="/images/image2.png"
                alt="Save Time, Park Smart"
                width={300}
                height={200}
                className="w-full rounded-xl mb-6 object-cover h-[200px] group-hover:scale-[1.02] transition-transform"
              />
              <h4 className="text-xl font-bold mb-3">Save Time, Park Smart</h4>
              <p className="text-gray-600 mb-6">
                No more circling blocks for parking! Instantly find and reserve spots near your destination with just a few taps. Simplify your urban parking experience.
              </p>
              <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all group-hover:translate-x-1">
                Learn More <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] border border-gray-100 group">
              <Image
                src="/images/image3.png"
                alt="Secure Parking"
                width={300}
                height={200}
                className="w-full rounded-xl mb-6 object-cover h-[200px] group-hover:scale-[1.02] transition-transform"
              />
              <h4 className="text-xl font-bold mb-3">Secure Parking, Guaranteed</h4>
              <p className="text-gray-600 mb-6">
                Your safety matters to us. Book parking spots verified by trusted space owners and enjoy a worry-free experience with our secure payment system.
              </p>
              <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all group-hover:translate-x-1">
                Get Started <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 group">
            <Image
              src="/images/Frame 35.png"
              alt="Download App"
              width={400}
              height={400}
              className="w-full hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="w-full md:w-1/2">
            <div className="mb-6 inline-block">
              <span className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 px-4 py-1.5 rounded-full text-orange-500 text-sm font-medium">
                Mobile App
              </span>
            </div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Download Our App
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Take control of your parking experience with BookMySpot! Get timely spot updates and experience hassle-free parking in your fingertips. Available on all major platforms, it's faster, safer, and more convenient than ever.
            </p>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-orange-500/20 transition-all hover:translate-y-[-2px]">
              Download Now
            </button>
          </div>
        </div>
      </section>

      {/* Promotion Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <div className="mb-6 inline-block">
              <span className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 px-4 py-1.5 rounded-full text-orange-500 text-sm font-medium">
                Special Offer
              </span>
            </div>
            <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Unlock Your Parking
            </h3>
            <h4 className="text-3xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Savings Today!
            </h4>
            <p className="text-gray-600 mb-8 text-lg">
              Experience the convenience of urban parking with a special offer.
              Enjoy 70% off your first booking and simplify your parking experience.
            </p>
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="group">
                <FaClock className="text-4xl text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold mb-2 text-gray-800">Limited Time</h5>
                <p className="text-gray-600">Don't miss out on this exclusive discount for new users!</p>
              </div>
              <div className="group">
                <FaParking className="text-4xl text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold mb-2 text-gray-800">Get Started</h5>
                <p className="text-gray-600">Join our community and find your perfect parking spot today.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white px-8 py-3.5 rounded-lg font-medium shadow-lg transition-all hover:translate-y-[-2px]">
                Claim Now
              </button>
              <button className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-6 py-3.5 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all hover:translate-y-[-2px] group">
                Learn More <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow group">
              <Image
                src="/images/image4.png"
                alt="Special Offer"
                width={500}
                height={400}
                className="w-full object-cover h-[400px] group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
