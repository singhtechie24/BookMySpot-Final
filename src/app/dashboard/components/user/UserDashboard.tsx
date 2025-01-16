'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@/services/userService';
import { FaParking, FaCalendarCheck, FaHistory, FaClock, FaSearch, FaMapMarkerAlt, FaMoneyBillWave, FaLocationArrow, FaHeart, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, deleteDoc, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useLoadScript, GoogleMap, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { Combobox } from '@headlessui/react';
import type { PlaceDetails } from '@/types/parkingSpot';
import { toast } from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase-client';
import { useRouter } from 'next/navigation';

const libraries: Libraries = ['places'];

function getDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

interface UserDashboardProps {
  user: User;
}

interface Booking {
  id: string;
  spotId: string;
  spotName: string;
  startTime: { toDate: () => Date };
  endTime: { toDate: () => Date };
  status: string;
  totalAmount: number;
}

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
  location?: {
    lat: number;
    lng: number;
  };
}

interface SearchBoxProps {
  onPlaceSelect: (location: { lat: number; lng: number }) => void;
}

const SearchBox = ({ onPlaceSelect }: SearchBoxProps) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'gb' },
    },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onPlaceSelect({ lat, lng });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Combobox value={value} onChange={handleSelect}>
      <div className="relative">
        <Combobox.Input
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Search for a location..."
        />
        <Combobox.Options className="absolute z-10 mt-1 w-full bg-gray-700 rounded-md shadow-lg">
          {status === 'OK' && data.map(({ place_id, description }) => (
            <Combobox.Option
              key={place_id}
              value={description}
              className={({ active }) =>
                `${active ? 'bg-blue-600' : ''} cursor-pointer select-none py-2 px-4 text-white`
              }
            >
              {description}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

interface GeocodingResult {
  lat: number;
  lng: number;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [stats, setStats] = useState({
    activeBookings: 0,
    favoriteSpots: 0,
    completedBookings: 0,
    monthlySpending: 0,
    totalSpending: 0,
    unreadNotifications: 0
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [availableSpots, setAvailableSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [center, setCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // India center
  const mapRef = useRef<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<google.maps.places.PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [searchRadius, setSearchRadius] = useState(1000); // 1km default
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();
  const geocodeCache = useRef<Map<string, GeocodingResult>>(new Map());
  const lastGeocode = useRef<number>(0);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const geocodeAddress = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    const cacheKey = address.toLowerCase().trim();
    if (geocodeCache.current.has(cacheKey)) {
      return geocodeCache.current.get(cacheKey) || null;
    }

    // Rate limiting: wait if less than 1 second since last request
    const now = Date.now();
    const timeSinceLastRequest = now - lastGeocode.current;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    lastGeocode.current = Date.now();

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ address });
      
      if (response.results && response.results[0]?.geometry?.location) {
        const location: GeocodingResult = {
          lat: response.results[0].geometry.location.lat(),
          lng: response.results[0].geometry.location.lng(),
        };
        
        geocodeCache.current.set(cacheKey, location);
        
        if (user?.id) {
          try {
            const cacheRef = doc(db, 'geocodeCache', cacheKey);
            await setDoc(cacheRef, {
              address,
              location,
              timestamp: new Date(),
            }, { merge: true });
          } catch (error) {
            console.error('Error caching geocode result:', error);
          }
        }
        
        return location;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }, [user?.id]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const panTo = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(14);
    }
  }, []);

  const searchNearbyPlaces = useCallback(async (location: { lat: number; lng: number }) => {
    if (!window.google || !mapRef.current) return;

    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: searchRadius,
      type: 'point_of_interest'
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setNearbyPlaces(results);
      }
    });
  }, [searchRadius]);

  const handleLocationSelect = useCallback((location: { lat: number; lng: number }) => {
    setCenter(location);
    panTo(location);
    searchNearbyPlaces(location);
  }, [panTo, searchNearbyPlaces]);

  const handlePlaceClick = useCallback((place: google.maps.places.PlaceResult) => {
    if (!window.google || !mapRef.current || !place.place_id || !place.geometry?.location) return;

    const service = new window.google.maps.places.PlacesService(mapRef.current);
    
    service.getDetails(
      {
        placeId: place.place_id,
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'user_ratings_total',
          'opening_hours',
          'photos',
          'website',
          'formatted_phone_number',
          'reviews',
          'price_level',
          'vicinity',
          'types'
        ]
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result && result.geometry?.location) {
          const location = result.geometry.location;
          const placeDetails: PlaceDetails = {
            formatted_address: result.formatted_address || '',
            geometry: {
              location: {
                lat: () => location.lat(),
                lng: () => location.lng()
              }
            },
            name: result.name || '',
            vicinity: result.vicinity || '',
            types: result.types || [],
            rating: result.rating || 0,
            user_ratings_total: result.user_ratings_total || 0,
            opening_hours: result.opening_hours ? {
              open_now: result.opening_hours.isOpen() || false
            } : undefined,
            photos: result.photos,
            reviews: result.reviews?.map(review => ({
              author_name: review.author_name || '',
              rating: review.rating || 0,
              relative_time_description: review.relative_time_description || '',
              text: review.text || ''
            }))
          };
          setSelectedPlace(placeDetails);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch user's bookings
    const bookingsRef = collection(db, 'bookings');
    const activeBookingsQuery = query(
      bookingsRef,
      where('userId', '==', user.id),
      where('status', '==', 'active')
    );

    const unsubscribeActive = onSnapshot(activeBookingsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        activeBookings: snapshot.docs.length
      }));
    });

    // Fetch user's favorite spots with real-time updates
    const favoritesRef = collection(db, 'favorites');
    const favoritesQuery = query(favoritesRef, where('userId', '==', user.id));
    
    const unsubscribeFavorites = onSnapshot(favoritesQuery, (snapshot) => {
      const favoriteSpotIds = snapshot.docs.map(doc => doc.data().spotId);
      setFavorites(favoriteSpotIds);
      setStats(prev => ({
        ...prev,
        favoriteSpots: favoriteSpotIds.length
      }));
    });

    // Fetch completed bookings
    const completedBookingsQuery = query(
      bookingsRef,
      where('userId', '==', user.id),
      where('status', '==', 'completed')
    );

    const unsubscribeCompleted = onSnapshot(completedBookingsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        completedBookings: snapshot.docs.length
      }));
    });

    // Fetch recent bookings
    const recentBookingsQuery = query(
      bookingsRef,
      where('userId', '==', user.id),
      orderBy('startTime', 'desc'),
      limit(5)
    );

    const unsubscribeRecent = onSnapshot(recentBookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      
      // Ensure unique bookings by combining id and spotId
      const uniqueBookings = bookings.reduce((acc, booking) => {
        const key = `${booking.id}-${booking.spotId}`;
        if (!acc.some(b => `${b.id}-${b.spotId}` === key)) {
          acc.push(booking);
        }
        return acc;
      }, [] as Booking[]);
      
      setRecentBookings(uniqueBookings);
    });

    // Fetch available parking spots
    const spotsRef = collection(db, 'parkingSpots');
    const availableSpotsQuery = query(
      spotsRef,
      where('availability', '==', 'available'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeSpots = onSnapshot(availableSpotsQuery, (snapshot) => {
      const spots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[];

      // Ensure unique spots
      const uniqueSpots = spots.reduce((acc, spot) => {
        if (!acc.some(s => s.id === spot.id)) {
          acc.push(spot);
        }
        return acc;
      }, [] as ParkingSpot[]);

      // Extract unique cities
      const uniqueCities = Array.from(new Set(uniqueSpots.map(spot => spot.city)));
      setCities(uniqueCities.sort());
      setAvailableSpots(uniqueSpots);
      setLoading(false);
    });

    // Add notification listener
    const notificationsRef = collection(db, 'notifications');
    const unreadNotificationsQuery = query(
      notificationsRef,
      where('userId', '==', user.id),
      where('status', '==', 'unread')
    );

    const unsubscribeNotifications = onSnapshot(unreadNotificationsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        unreadNotifications: snapshot.docs.length
      }));
    });

    return () => {
      unsubscribeActive();
      unsubscribeCompleted();
      unsubscribeRecent();
      unsubscribeSpots();
      unsubscribeFavorites();
      unsubscribeNotifications();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    
    const geocodeSpots = async () => {
      if (!availableSpots || availableSpots.length === 0) return;

      try {
        const validSpots = availableSpots.filter(spot => {
          if (!spot.address || !spot.city) {
            console.warn(`Skipping spot ${spot.id} - missing address (${spot.address}) or city (${spot.city})`);
            return false;
          }
          return true;
        });

        if (validSpots.length === 0) {
          console.warn('No valid spots to geocode');
          return;
        }

        const updatedSpots = await Promise.all(
          validSpots.map(async (spot) => {
            try {
              const formattedAddress = `${spot.address.trim()}, ${spot.city.trim()}, India`;
              const location = await geocodeAddress(formattedAddress);
              
              if (location) {
                return {
                  ...spot,
                  location,
                };
              } else {
                console.warn(`No geocoding results for address: ${formattedAddress}`);
                return spot;
              }
            } catch (error) {
              console.error(`Error geocoding spot ${spot.id}:`, error);
              return spot;
            }
          })
        );

        // Only update state with spots that have valid data
        const filteredSpots = updatedSpots.filter(spot => spot !== null);
        setAvailableSpots(filteredSpots);
      } catch (error) {
        console.error('Error in geocoding spots:', error);
        toast.error('Error loading some parking spots');
      }
    };

    geocodeSpots();
  }, [availableSpots, isLoaded, geocodeAddress]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setCenter(location);
          if (mapRef.current) {
            mapRef.current.panTo(location);
            mapRef.current.setZoom(14);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'completed':
        return 'text-blue-500 bg-blue-500/10';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const filteredSpots = availableSpots.filter(spot => {
    const matchesCity = !selectedCity || spot.city === selectedCity;
    return matchesCity;
  });

  const handleToggleFavorite = async (spot: ParkingSpot) => {
    if (!user?.id) {
      toast.error('You must be logged in to add favorites');
      return;
    }

    try {
      const favoritesRef = collection(db, 'favorites');
      const favoriteQuery = query(
        favoritesRef,
        where('userId', '==', user.id),
        where('spotId', '==', spot.id)
      );
      const snapshot = await getDocs(favoriteQuery);

      if (snapshot.empty) {
        // Add to favorites
        await addDoc(favoritesRef, {
          userId: user.id,
          spotId: spot.id,
          createdAt: new Date()
        });
        toast.success('Added to favorites');
      } else {
        // Remove from favorites
        const docToDelete = snapshot.docs[0];
        await deleteDoc(docToDelete.ref);
        toast.success('Removed from favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Profile Section */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-700/50">
        <div className="p-4 sm:p-6 border-b border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="BookMySpot"
                width={40}
                height={40}
                className="mr-3"
              />
              <span className="text-2xl font-bold text-white">BookMySpot</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/notifications"
                className="relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-xl"
              >
                <FaBell size={22} />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.unreadNotifications}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm px-4 py-2 hover:bg-blue-500/10 rounded-xl"
              >
                Manage Profile
              </Link>
              <button
                onClick={async () => {
                  try {
                    await signOut(auth);
                    router.push('/');
                    toast.success('Signed out successfully');
                  } catch (error) {
                    console.error('Error signing out:', error);
                    toast.error('Failed to sign out');
                  }
                }}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm"
              >
                <FaSignOutAlt />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-blue-500/20">
              <Image
                src={user.photoURL || '/default-avatar.png'}
                alt={user.displayName || 'User'}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{user.displayName || 'User'}</h3>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-sm text-gray-500 mt-2">Member since {format(new Date(user.createdAt), 'MMMM yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Active Bookings</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{stats.activeBookings}</h3>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <FaCalendarCheck className="text-2xl text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Favorite Spots</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{stats.favoriteSpots}</h3>
                </div>
                <div className="bg-green-500/10 p-3 rounded-xl">
                  <FaParking className="text-2xl text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Completed Bookings</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{stats.completedBookings}</h3>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-xl">
                  <FaHistory className="text-2xl text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Spending</p>
                  <h3 className="text-2xl font-bold text-white mt-1">£{stats.monthlySpending.toFixed(2)}</h3>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                  <FaMoneyBillWave className="text-2xl text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700/50 hover:bg-gray-800/70 transition-all">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Total Spending</p>
                  <h3 className="text-2xl font-bold text-white mt-1">£{stats.totalSpending.toFixed(2)}</h3>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <FaMoneyBillWave className="text-2xl text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search Section */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FaSearch className="text-blue-400" />
              Find Parking Spots
            </h2>
            <div className="space-y-4">
              <SearchBox onPlaceSelect={handleLocationSelect} />
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="bg-gray-700/50 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600/50"
                >
                  <option value={500}>500m radius</option>
                  <option value={1000}>1km radius</option>
                  <option value={2000}>2km radius</option>
                  <option value={5000}>5km radius</option>
                </select>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-gray-700/50 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600/50"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={`city-${city}`} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
            <div className="p-6">
              <div className="rounded-xl overflow-hidden relative">
                <button
                  onClick={() => {
                    if (userLocation) {
                      panTo(userLocation);
                      searchNearbyPlaces(userLocation);
                    }
                  }}
                  className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-lg p-3 rounded-xl shadow-lg hover:bg-white/20 transition-all"
                  title="Pan to current location"
                >
                  <FaLocationArrow className="text-white" />
                </button>
                <GoogleMap
                  mapContainerStyle={{
                    width: '100%',
                    height: '400px',
                    borderRadius: '1rem'
                  }}
                  zoom={14}
                  center={center}
                  onLoad={onMapLoad}
                  options={{
                    styles: [
                      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    ],
                  }}
                >
                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: '#4F46E5',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 8
                      }}
                    />
                  )}

                  {/* Parking Spot Markers */}
                  {filteredSpots.map((spot) => 
                    spot.location && (
                      <Marker
                        key={`parking-spot-${spot.id}`}
                        position={spot.location}
                        onClick={() => setSelectedSpot(spot)}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          fillColor: spot.availability === 'available' ? '#10B981' : '#EF4444',
                          fillOpacity: 1,
                          strokeWeight: 0,
                          scale: 10
                        }}
                      />
                    )
                  )}

                  {/* Nearby Places Markers */}
                  {nearbyPlaces.map((place) => 
                    place.geometry?.location && (
                      <Marker
                        key={`nearby-place-${place.place_id}`}
                        position={place.geometry.location}
                        onClick={() => handlePlaceClick(place)}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          fillColor: '#9333EA',
                          fillOpacity: 0.7,
                          strokeWeight: 0,
                          scale: 8
                        }}
                      />
                    )
                  )}

                  {/* InfoWindows */}
                  {selectedSpot && selectedSpot.location && (
                    <InfoWindow
                      position={selectedSpot.location}
                      onCloseClick={() => setSelectedSpot(null)}
                    >
                      <div className="bg-white p-4 rounded-lg max-w-xs">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{selectedSpot.name}</h3>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleFavorite(selectedSpot);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title={favorites.includes(selectedSpot.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <FaHeart 
                              size={24}
                              className={`${
                                favorites.includes(selectedSpot.id) 
                                  ? 'text-red-500' 
                                  : 'text-gray-400 hover:text-red-500'
                              } transition-colors`}
                            />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{selectedSpot.address}</p>
                        <p className="text-sm font-medium text-gray-900 mt-2">£{selectedSpot.pricePerHour}/hour</p>
                        <Link
                          href={`/spots/${selectedSpot.id}/book`}
                          className="mt-3 block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Book Now
                        </Link>
                      </div>
                    </InfoWindow>
                  )}

                  {selectedPlace && (
                    <InfoWindow
                      position={{
                        lat: selectedPlace.geometry.location.lat(),
                        lng: selectedPlace.geometry.location.lng()
                      }}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div className="bg-white p-4 rounded-lg max-w-xs">
                        <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedPlace.vicinity}</p>
                        
                        {selectedPlace.rating !== undefined && (
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={`star-${selectedPlace.name}-${i}`}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(selectedPlace.rating!)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {selectedPlace.rating.toFixed(1)}
                              {selectedPlace.user_ratings_total !== undefined && 
                                ` (${selectedPlace.user_ratings_total} reviews)`
                              }
                            </span>
                          </div>
                        )}
                        
                        {selectedPlace.opening_hours?.open_now !== undefined && (
                          <p className={`text-sm mt-2 ${
                            selectedPlace.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedPlace.opening_hours.open_now ? 'Open Now' : 'Closed'}
                          </p>
                        )}
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedPlace.types.slice(0, 3).map((type, index) => (
                            <span
                              key={`type-${selectedPlace.name}-${type}-${index}`}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {type.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                        
                        {selectedPlace.photos?.[0] && (
                          <div className="mt-3 relative h-32 rounded-lg overflow-hidden">
                            <Image
                              src={selectedPlace.photos[0].getUrl()}
                              alt={selectedPlace.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-between gap-2">
                          <button
                            onClick={() => {
                              if (mapRef.current) {
                                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${
                                  selectedPlace.geometry.location.lat()
                                },${selectedPlace.geometry.location.lng()}`;
                                window.open(directionsUrl, '_blank');
                              }
                            }}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Get Directions
                          </button>
                          
                          <button
                            onClick={() => {
                              const nearbySpots = filteredSpots.filter(spot => spot.location && 
                                getDistance(
                                  spot.location,
                                  {
                                    lat: selectedPlace.geometry.location.lat(),
                                    lng: selectedPlace.geometry.location.lng()
                                  }
                                ) <= 1000 // Within 1km
                              );
                              
                              if (nearbySpots.length > 0) {
                                setSelectedSpot(nearbySpots[0]);
                              }
                            }}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Find Parking
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            </div>
          </div>

          {/* Available Parking Spots */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaParking className="text-green-400" />
                  Available Parking Spots
                </h2>
                <span className="text-sm text-gray-400">{filteredSpots.length} spots found</span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpots.length > 0 ? (
                filteredSpots.map((spot) => (
                  <div key={`parking-spot-${spot.id}`} 
                       className="group bg-gray-700/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-600/30 hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-300">
                    <div className="relative h-40">
                      <Image
                        src={spot.imageUrl || '/placeholder-parking.jpg'}
                        alt={spot.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFavorite(spot);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-all"
                        title={favorites.includes(spot.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <FaHeart 
                          size={20}
                          className={`${
                            favorites.includes(spot.id) 
                              ? 'text-red-400' 
                              : 'text-gray-200 hover:text-red-400'
                          } transition-colors`}
                        />
                      </button>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-semibold text-white truncate">{spot.name}</h3>
                        <span className="text-green-400 font-medium whitespace-nowrap">
                          £{spot.pricePerHour}/hr
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{spot.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <FaMapMarkerAlt className="text-blue-400 shrink-0" />
                        <span className="truncate">{spot.address}, {spot.city}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (spot.location) {
                              panTo(spot.location);
                              setSelectedSpot(spot);
                            }
                          }}
                          className="flex-1 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 py-1.5 rounded-lg transition-colors text-xs"
                        >
                          View on Map
                        </button>
                        <Link
                          href={`/spots/${spot.id}/book`}
                          className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-1.5 rounded-lg transition-colors text-center text-xs"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <FaParking className="mx-auto text-3xl text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No parking spots found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel - Recent Bookings */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden sticky top-8">
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaClock className="text-blue-400" />
                  Recent Bookings
                </h2>
                <Link
                  href="/dashboard/my-bookings"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors px-3 py-1 hover:bg-blue-500/10 rounded-lg"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-700/50 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={`booking-${booking.id}-${booking.spotId}-${booking.startTime.toDate().getTime()}`} 
                       className="p-3 hover:bg-gray-700/50 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-white text-sm">{booking.spotName}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {format(booking.startTime.toDate(), 'MMM d, h:mm a')} - 
                        {format(booking.endTime.toDate(), 'h:mm a')}
                      </p>
                      <p className="text-sm font-medium text-white">
                        £{booking.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No recent bookings found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 