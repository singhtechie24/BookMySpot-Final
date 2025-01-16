export type SpotAvailability = 'available' | 'maintenance';
export type SpotStatus = 'pending' | 'approved' | 'rejected';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ParkingSpot {
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
  location?: {
    lat: number;
    lng: number;
  };
}

export interface NearbyPlace {
  name: string;
  vicinity: string;
  types: string[];
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    getUrl: () => string;
  }>;
}

export interface PlaceDetails extends NearbyPlace {
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
  }>;
  price_level?: number;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ParkingSpotRequest {
  id: string;
  ownerId: string;
  ownerEmail: string;
  spotName: string;
  address: string;
  description: string;
  pricePerHour: number;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  rejectionReason?: string;
  type?: 'new_spot' | 'availability_update' | 'edit_spot';
  requestedAvailability?: 'available' | 'unavailable';
  spotId?: string;
  currentAvailability?: 'available' | 'unavailable';
  city?: string;
  days?: string[];
  timeSlots?: TimeSlot[];
  // Fields for edit requests
  currentSpotData?: {
    name: string;
    description: string;
    address: string;
    city: string;
    pricePerHour: number;
    imageUrl?: string;
    days: string[];
    timeSlots: TimeSlot[];
  };
  requestedSpotData?: {
    name: string;
    description: string;
    address: string;
    city: string;
    pricePerHour: number;
    imageUrl?: string;
    days: string[];
    timeSlots: TimeSlot[];
  };
} 