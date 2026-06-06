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

export interface Booking {
  id: string;
  shipperId: string;
  shipper?: User;
  driverId: string | null;
  driver?: User | null;
  status: BookingStatus;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
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
  otp: string | null;
  createdAt: string;
  updatedAt: string;
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
  dropoffLat: number;
  dropoffLng: number;
  cargoType: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  vehicleType: VehicleType;
}

export interface PriceBreakdown {
  basePrice: number;
  distancePrice: number;
  weightPrice: number;
  totalPrice: number;
  distanceKm: number;
}
