export interface LatLng {
  lat: number,
  lng: number,
}
export interface MapMarker {
  id: string;
  position: LatLng;
  title?: string;
  type: 'PICKUP' | 'DROPOFF' | 'DRIVER';
  driverId?: string;
  vehicleType?: string;
}
export interface RouteInfo {
  distanceKm: number;
  coordinates: LatLng[];
  durationMinutes?: number;
}
