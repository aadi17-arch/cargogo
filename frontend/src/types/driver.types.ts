import { User } from './auth.types';
import { Vehicle } from './vehicle.types';

export interface DriverProfile {
  id: string;
  userId: string;
  isOnline: boolean;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
  user?: User;
}

export interface DriverStatusUpdate {
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
}

export interface DriverWithVehicle extends User {
  driverProfile: DriverProfile | null;
  vehicle: Vehicle | null;
}

export interface VrpStop {
  type: 'PICKUP' | 'DROPOFF';
  bookingId: string;
  location: { lat: number; lng: number };
  cargoType: string;
  weightKg: number;
  expectedAccumulatedWeight: number;
}

export interface VrpRouteResponse {
  startLocation: { lat: number; lng: number };
  vehicleCapacityKg: number;
  totalDistanceKm: number;
  route: VrpStop[];
}
