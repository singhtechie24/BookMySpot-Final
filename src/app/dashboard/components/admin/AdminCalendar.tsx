'use client';

import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US')
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

export default function AdminCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(bookingsRef);
      
      const snapshot = await getDocs(bookingsQuery);
      const bookings = snapshot.docs.map(doc => {
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

      setEvents(bookings);
      setLoading(false);
    };

    fetchBookings();
  }, []);

  const eventStyleGetter = (event: Event) => {
    let style = {
      backgroundColor: '#3182ce', // default blue
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block'
    };

    switch (event.status) {
      case 'confirmed':
        style.backgroundColor = '#38a169'; // green
        break;
      case 'pending':
        style.backgroundColor = '#d69e2e'; // yellow
        break;
      case 'cancelled':
        style.backgroundColor = '#e53e3e'; // red
        break;
    }

    return {
      style
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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