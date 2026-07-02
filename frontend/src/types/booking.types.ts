import { User } from './auth.types';
import { VehicleType } from './vehicle.types';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'DISPUTED';

// NEW: Differentiates the two booking archetypes
export type BookingType = 'INSTANT' | 'SCHEDULED';

export interface Booking {
  id: string;
  shipperId: string;
  shipper?: User;
  driverId: string | null;
  driver?: User | null;
  status: BookingStatus;
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress?: string;
  cargoType: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeight: number;
  vehicleType: VehicleType;
  distanceKm: number;
  basePrice: number;
  distancePrice: number;
  weightPrice: number;
  totalPrice: number;
  price: number;
  otp: string | null;
  pickupOTP?: string | null;
  dropoffOTP?: string | null;
  createdAt: string;
  updatedAt: string;
  // Scheduled delivery fields
  bookingType: BookingType;
  scheduledAt?: string | null;
  scheduledUntil?: string | null;
  committedAt?: string | null;
}

export interface CargoDetails {
  cargoType: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface CreateBookingRequest {
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress?: string;
  cargoType: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  vehicleType: VehicleType;
  // Scheduled option parameters
  bookingType?: BookingType;
  scheduledAt?: string;
  scheduledUntil?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  distancePrice: number;
  weightPrice: number;
  totalPrice: number;
  distanceKm: number;
}

// Represents a scheduled job on the driver board
export interface ScheduledJob {
  id: string;
  cargoType: string;
  vehicleType: VehicleType;
  weightKg: number;
  scheduledAt: string;
  scheduledUntil?: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  price: number;
}
