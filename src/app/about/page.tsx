'use client';

import { FaParking, FaUsers, FaGlobe, FaHandshake } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

const stats = [
  {
    icon: <FaParking className="w-6 h-6" />,
    value: "1000+",
    label: "Parking Spots"
  },
  {
    icon: <FaUsers className="w-6 h-6" />,
    value: "5000+",
    label: "Happy Users"
  },
  {
    icon: <FaGlobe className="w-6 h-6" />,
    value: "10+",
    label: "Cities Covered"
  },
  {
    icon: <FaHandshake className="w-6 h-6" />,
    value: "99%",
    label: "Satisfaction Rate"
  }
];

const teamMembers = [
  {
    name: "John Smith",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=387&auto=format&fit=crop"
  },
  {
    name: "Sarah Johnson",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=388&auto=format&fit=crop"
  },
  {
    name: "Michael Brown",
    role: "Technical Lead",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=870&auto=format&fit=crop"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-blue-600 to-blue-800 py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/50 to-blue-900/50"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <span className="bg-blue-500/20 px-4 py-1.5 rounded-full text-blue-200 text-sm font-medium border border-blue-400/20">
              Our Story
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            About BookMySpot
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to revolutionize the way people find and book parking spots,
            making urban mobility smoother and more efficient for everyone.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group hover:translate-y-[-4px] transition-all duration-300">
              <div className="text-blue-500 flex justify-center mb-4 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-6 inline-block">
                <span className="bg-blue-500/20 px-4 py-1.5 rounded-full text-blue-200 text-sm font-medium border border-blue-400/20">
                  Since 2023
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Our Story
              </h2>
              <div className="space-y-6 text-gray-300 text-lg">
                <p className="leading-relaxed">
                  Founded in 2023, BookMySpot emerged from a simple observation: finding parking
                  in urban areas is often a frustrating and time-consuming experience.
                </p>
                <p className="leading-relaxed">
                  We set out to create a platform that would connect drivers with available
                  parking spots, making the process seamless and stress-free.
                </p>
                <p className="leading-relaxed">
                  Today, we're proud to serve thousands of users across multiple cities,
                  helping them save time and reduce the hassle of parking.
                </p>
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
              <Image
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=870&auto=format&fit=crop"
                alt="BookMySpot Office"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-6 inline-block">
            <span className="bg-blue-500/20 px-4 py-1.5 rounded-full text-blue-200 text-sm font-medium border border-blue-400/20">
              Our Vision
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Our Mission
          </h2>
          <p className="text-gray-300 mb-12 text-lg leading-relaxed">
            To transform urban parking by creating a sustainable, efficient, and user-friendly
            platform that benefits both parking spot owners and drivers. We envision a future
            where finding parking is no longer a challenge but a seamless part of your journey.
          </p>
          <Link 
            href="/features" 
            className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-2px]"
          >
            Explore Our Features
          </Link>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="mb-6 inline-block">
              <span className="bg-blue-500/20 px-4 py-1.5 rounded-full text-blue-200 text-sm font-medium border border-blue-400/20">
                Our People
              </span>
            </div>
            <h2 className="text-4xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Meet Our Team
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center group hover:translate-y-[-4px] transition-all duration-300">
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden shadow-xl">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-300">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-2xl p-16 backdrop-blur-sm">
          <div className="mb-6 inline-block">
            <span className="bg-blue-500/20 px-4 py-1.5 rounded-full text-blue-200 text-sm font-medium border border-blue-400/20">
              Get Started
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Get in Touch
          </h2>
          <p className="text-gray-300 mb-12 text-lg max-w-2xl mx-auto">
            Have questions or want to learn more about BookMySpot?
            We'd love to hear from you.
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-2px]"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
} 