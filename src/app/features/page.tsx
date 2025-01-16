'use client';

import { FaSearch, FaMapMarkedAlt, FaClock, FaMoneyBillWave, FaMobile, FaShieldAlt, FaStar, FaUserClock } from 'react-icons/fa';
import Link from 'next/link';

const features = [
  {
    icon: <FaSearch className="w-6 h-6" />,
    title: "Easy Spot Search",
    description: "Find parking spots near you with our intuitive search and filtering system. Search by location, price, or availability."
  },
  {
    icon: <FaMapMarkedAlt className="w-6 h-6" />,
    title: "Interactive Maps",
    description: "View parking spots on an interactive map with real-time availability updates and detailed location information."
  },
  {
    icon: <FaClock className="w-6 h-6" />,
    title: "Flexible Booking",
    description: "Book parking spots by the hour, day, or week. Choose time slots that work for you with our flexible scheduling system."
  },
  {
    icon: <FaMoneyBillWave className="w-6 h-6" />,
    title: "Secure Payments",
    description: "Make secure payments through our platform using various payment methods. Get instant booking confirmations."
  },
  {
    icon: <FaMobile className="w-6 h-6" />,
    title: "Mobile Friendly",
    description: "Access your bookings on any device. Our responsive design ensures a seamless experience across all platforms."
  },
  {
    icon: <FaShieldAlt className="w-6 h-6" />,
    title: "Verified Spots",
    description: "All parking spots are verified and reviewed to ensure quality and security for our users."
  },
  {
    icon: <FaStar className="w-6 h-6" />,
    title: "Rating System",
    description: "Read and leave reviews for parking spots. Make informed decisions based on other users' experiences."
  },
  {
    icon: <FaUserClock className="w-6 h-6" />,
    title: "24/7 Support",
    description: "Get assistance anytime with our round-the-clock customer support system."
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for Easy Parking
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover how BookMySpot makes finding and booking parking spots effortless
          </p>
          <Link 
            href="/signup" 
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
            >
              <div className="text-blue-500 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-800 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to experience hassle-free parking?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of users who have simplified their parking experience with BookMySpot
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/signup" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign Up Now
            </Link>
            <Link 
              href="/about" 
              className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 