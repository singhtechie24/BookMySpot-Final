export type UserRole = 'driver' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverProfile extends UserProfile {
  role: 'driver';
  licenseNumber?: string;
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
  };
}

export interface OwnerProfile extends UserProfile {
  role: 'owner';
  businessName?: string;
  businessAddress?: string;
  parkingSpots?: string[]; // Array of parking spot IDs
}

export interface AdminProfile extends UserProfile {
  role: 'admin';
  adminLevel?: 'super' | 'regular';
  permissions?: string[];
} 