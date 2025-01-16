'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FaCalendarAlt, FaClock, FaMoneyBillWave, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';
import { format, addHours, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { use } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { getAuth } from 'firebase/auth';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface ParkingSpot {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  city: string;
  pricePerHour: number;
  availability: 'available' | 'unavailable';
  days: string[];
  timeSlots: { start: string; end: string; }[];
  ownerId: string;
}

function CheckoutForm({ bookingId, amount, onSuccess }: { bookingId: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not been initialized');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred during submission');
        setProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/my-bookings`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed');
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred during payment');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-red-500 text-sm bg-red-100 p-2 rounded">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay £${amount}`}
      </button>
    </form>
  );
}

export default function BookSpotPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string; }[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string; } | null>(null);

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to book a parking spot');
      router.push('/login');
      return;
    }

    const fetchSpot = async () => {
      if (!resolvedParams.id) return;

      try {
        const spotDoc = await getDoc(doc(db, 'parkingSpots', resolvedParams.id));
        if (spotDoc.exists()) {
          const spotData = { id: spotDoc.id, ...spotDoc.data() } as ParkingSpot;
          if (spotData.availability === 'unavailable') {
            toast.error('This parking spot is currently unavailable');
            router.push('/dashboard');
            return;
          }
          setSpot(spotData);
          
          // Check for existing bookings for this spot
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('spotId', '==', spotData.id),
            where('status', 'in', ['active', 'pending']),
            where('startTime', '>=', new Date())
          );
          
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const existingBookings = bookingsSnapshot.docs.map(doc => doc.data());
          
          // Filter out time slots that overlap with existing bookings
          const availableSlots = spotData.timeSlots.filter(slot => {
            const slotStart = parseTime(slot.start);
            const slotEnd = parseTime(slot.end);
            return !existingBookings.some(booking => {
              const bookingStart = booking.startTime.toDate();
              const bookingEnd = booking.endTime.toDate();
              return isTimeOverlapping(slotStart, slotEnd, bookingStart, bookingEnd);
            });
          });
          
          setTimeSlots(availableSlots);
        } else {
          toast.error('Parking spot not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching spot:', error);
        toast.error('Failed to load parking spot details');
      } finally {
        setLoading(false);
      }
    };

    fetchSpot();
  }, [resolvedParams.id, user, router]);

  const parseTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const isTimeOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return start1 < end2 && start2 < end1;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedTimeSlot(slot);
    setStartTime(slot.start);
    if (spot) {
      setTotalAmount(spot.pricePerHour * duration);
    }
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (spot) {
      setTotalAmount(spot.pricePerHour * newDuration);
    }
  };

  const handleProceedToConfirmation = () => {
    if (!selectedTimeSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    if (!user || !spot || !selectedTimeSlot) return;

    try {
      setProcessing(true);

      // Get Firebase auth instance and current user
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        toast.error('Authentication error');
        setProcessing(false);
        return;
      }

      // Get the authentication token
      const token = await firebaseUser.getIdToken();
      if (!token) {
        toast.error('Authentication error');
        setProcessing(false);
        return;
      }

      // Create booking
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.start.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const endDateTime = addHours(startDateTime, duration);

      const bookingData = {
        userId: user.id,
        userEmail: user.email,
        spotId: spot.id,
        spotName: spot.name,
        spotAddress: spot.address,
        ownerId: spot.ownerId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: serverTimestamp()
      };

      // Add booking to Firestore
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      setBookingId(bookingRef.id);

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          bookingId: bookingRef.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'active',
        paymentStatus: 'completed',
        updatedAt: serverTimestamp()
      });

      toast.success('Booking confirmed successfully!');
      router.push('/dashboard/my-bookings');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Error updating booking status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Parking spot not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="relative h-64">
          <Image
            src={spot.imageUrl || '/placeholder-parking.jpg'}
            alt={spot.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">{spot.name}</h1>
          <p className="text-gray-400 mt-2">{spot.description}</p>
          <div className="mt-4 space-y-2">
            <p className="text-gray-400 flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-500" />
              {spot.address}, {spot.city}
            </p>
            <p className="text-white flex items-center gap-2">
              <FaMoneyBillWave className="text-green-500" />
              £{spot.pricePerHour}/hour
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Book Your Spot</h2>
        {!showPayment ? (
          !showConfirmation ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={handleDateChange}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <FaClock className="inline mr-2" />
                  Available Time Slots
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSlotSelect(slot)}
                      className={`p-2 rounded-lg text-sm ${
                        selectedTimeSlot?.start === slot.start
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <FaClock className="inline mr-2" />
                  Duration (hours)
                </label>
                <select
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                    <option key={hours} value={hours}>
                      {hours} {hours === 1 ? 'hour' : 'hours'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-white">£{totalAmount}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToConfirmation}
                disabled={!selectedTimeSlot || !selectedDate}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!selectedTimeSlot ? 'Select a time slot' : !selectedDate ? 'Select a date' : 'Review Booking'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Booking Summary</h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white">{selectedTimeSlot?.start} - {selectedTimeSlot?.end}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{duration} {duration === 1 ? 'hour' : 'hours'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price per hour:</span>
                  <span className="text-white">£{spot?.pricePerHour}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-white">£{totalAmount}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={processing}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          )
        ) : (
          clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#3B82F6',
                  },
                },
              }}
            >
              <CheckoutForm
                bookingId={bookingId}
                amount={totalAmount}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )
        )}
      </div>
    </div>
  );
} 