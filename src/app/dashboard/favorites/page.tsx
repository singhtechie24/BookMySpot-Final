'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase-client';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { FaMapMarkerAlt, FaMoneyBillWave, FaHeart, FaParking } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ParkingSpot {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  city: string;
  pricePerHour: number;
  availability: 'available' | 'unavailable';
}

interface Favorite {
  id: string;
  spotId: string;
  spot?: ParkingSpot;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch user's favorites with real-time updates
    const favoritesRef = collection(db, 'favorites');
    const favoritesQuery = query(favoritesRef, where('userId', '==', user.id));
    
    const unsubscribe = onSnapshot(favoritesQuery, async (snapshot) => {
      const favoritesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Favorite[];

      // Fetch spot details for each favorite
      const spotsRef = collection(db, 'parkingSpots');
      const favoritesWithSpots = await Promise.all(
        favoritesData.map(async (favorite) => {
          const spotDoc = doc(spotsRef, favorite.spotId);
          const spotSnapshot = await getDoc(spotDoc);
          if (spotSnapshot.exists()) {
            return {
              ...favorite,
              spot: { id: spotSnapshot.id, ...spotSnapshot.data() } as ParkingSpot,
            };
          }
          return favorite;
        })
      );

      // Filter out favorites where spot data couldn't be found
      setFavorites(favoritesWithSpots.filter(f => f.spot));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FaHeart className="text-red-500" />
            My Favorite Spots
          </h2>
        </div>
        <div className="p-6">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(({ id, spot }) => spot && (
                <div key={id} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="relative h-64">
                    <Image
                      src={spot.imageUrl || '/placeholder-parking.jpg'}
                      alt={spot.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-white">{spot.name}</h3>
                      <button
                        onClick={() => handleRemoveFavorite(id)}
                        className="p-2 rounded-full hover:bg-gray-600 transition-colors"
                        title="Remove from favorites"
                      >
                        <FaHeart className="text-red-500" size={24} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{spot.description}</p>
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
                    <Link
                      href={`/spots/${spot.id}/book`}
                      className="mt-4 block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaParking className="mx-auto text-4xl text-gray-600 mb-4" />
              <p className="text-gray-400">No favorite spots found</p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block text-blue-500 hover:text-blue-400 transition-colors"
              >
                Browse available spots
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 