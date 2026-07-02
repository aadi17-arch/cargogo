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
  // NEW: Scheduled booking fields — all optional/nullable so existing code is unaffected
  bookingType: BookingType;
  scheduledAt?: string | null;       // ISO date string from API
  scheduledUntil?: string | null;
  committedAt?: string | null;       // When the driver committed
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
  // NEW: Optional scheduled booking fields
  bookingType?: BookingType;
  scheduledAt?: string;    // ISO 8601 datetime string
  scheduledUntil?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  distancePrice: number;
  weightPrice: number;
  totalPrice: number;
  distanceKm: number;
}

/**
 * NEW: Represents a scheduled job as seen by the driver's Browse Jobs board.
 * This is a summary view — lighter than the full Booking object.
 */
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
