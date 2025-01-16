'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope, FaArrowRight } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-[#092C4C] text-white">
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5"></div>
      
      {/* Newsletter Section */}
      <div className="relative border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Stay Updated
                </h3>
                <p className="text-sm md:text-base text-gray-300">
                  Subscribe to our newsletter for the latest updates and parking solutions.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm md:text-base"
                />
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:translate-y-[-2px] text-sm md:text-base whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div className="space-y-6">
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
            <p className="text-sm md:text-base text-gray-400 leading-relaxed">
              Making urban parking effortless and accessible for everyone. Find and book parking spots with ease.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 md:mt-0">
            <h6 className="text-lg font-semibold mb-4 md:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Quick Links
            </h6>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-blue-400 transition-all hover:translate-x-1 inline-flex items-center gap-1 group">
                  <FaArrowRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-gray-400 hover:text-blue-400 transition-all hover:translate-x-1 inline-flex items-center gap-1 group">
                  <FaArrowRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Features
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-blue-400 transition-all hover:translate-x-1 inline-flex items-center gap-1 group">
                  <FaArrowRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="mt-4 md:mt-0">
            <h6 className="text-lg font-semibold mb-4 md:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Services
            </h6>
            <ul className="space-y-3">
              <li>
                <Link href="/parking-spots" className="text-gray-400 hover:text-blue-400 transition-all hover:translate-x-1 inline-flex items-center gap-1 group">
                  <FaArrowRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Find Parking
                </Link>
              </li>
              <li>
                <Link href="/list-spot" className="text-gray-400 hover:text-blue-400 transition-all hover:translate-x-1 inline-flex items-center gap-1 group">
                  <FaArrowRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  List Your Spot
                </Link>
              </li>
              <li>
                <Link href="/business" className="text-gray-400 hover:text-blue-400 transition-all hover:translate-x-1 inline-flex items-center gap-1 group">
                  <FaArrowRight className="text-xs opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Business Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="mt-4 md:mt-0">
            <h6 className="text-lg font-semibold mb-4 md:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Contact
            </h6>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-400 group">
                <FaEnvelope className="group-hover:text-blue-400 transition-colors" />
                <a href="mailto:support@bookmyspot.com" className="text-sm md:text-base hover:text-blue-400 transition-colors">
                  support@bookmyspot.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400 group">
                <FaPhone className="group-hover:text-blue-400 transition-colors" />
                <a href="tel:+15551234567" className="text-sm md:text-base hover:text-blue-400 transition-colors">
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400 group">
                <FaMapMarkerAlt className="mt-1 group-hover:text-blue-400 transition-colors" />
                <span className="text-sm md:text-base">
                  123 Parking Street,<br />
                  City, State 12345
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 md:mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} BookMySpot. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 