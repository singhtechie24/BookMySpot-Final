'use client';

import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { User } from '@/services/userService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Link from 'next/link';
import enUS from 'date-fns/locale/en-US';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  spotId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface SpaceOwnerCalendarProps {
  user: User;
}

export default function SpaceOwnerCalendar({ user }: SpaceOwnerCalendarProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;

      try {
        // First get all spots owned by the user
        const spotsRef = collection(db, 'parkingSpots');
        const spotsQuery = query(spotsRef, where('ownerId', '==', user.id));
        const spotsSnapshot = await getDocs(spotsQuery);
        const spotIds = spotsSnapshot.docs.map(doc => doc.id);

        // If user has no spots, return empty events
        if (spotIds.length === 0) {
          setEvents([]);
          setError(null);
          setLoading(false);
          return;
        }

        // Get bookings for all spots
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(
          bookingsRef,
          where('spotId', 'in', spotIds)
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const newEvents = bookingsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: `${data.spotName} - ${data.userName}`,
            start: data.startTime.toDate(),
            end: data.endTime.toDate(),
            spotId: data.spotId,
            userId: data.userId,
            status: data.status
          };
        });

        setEvents(newEvents);
        setError(null);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load calendar events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.id]);

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = '#3182ce'; // default blue
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#38a169'; // green
        break;
      case 'pending':
        backgroundColor = '#d69e2e'; // yellow
        break;
      case 'cancelled':
        backgroundColor = '#e53e3e'; // red
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-[600px] bg-gray-800 p-6 rounded-xl flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">No bookings found</p>
        <Link 
          href="/dashboard/my-spots"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Manage Your Spots
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-gray-800 p-6 rounded-xl">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ 
          height: '100%',
          backgroundColor: '#1f2937',
          padding: '1rem'
        }}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day']}
        defaultView="month"
      />
    </div>
  );
} 