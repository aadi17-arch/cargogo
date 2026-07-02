export const BASE_URL = (import.meta as any).env?.VITE_API_URL || '';
export const SOCKET_URL = (import.meta as any).env?.VITE_WS_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
export const API_URL = `${BASE_URL}/api`;
export const VEHICLE_RATES = {
  TWO_WHEELER: { name: '2-Wheeler', basePrice: 30, pricePerKm: 8 },
  THREE_WHEELER: { name: '3-Wheeler', basePrice: 40, pricePerKm: 12 },
  MINI_TEMPO: { name: 'Mini Tempo', basePrice: 50, pricePerKm: 15 },
  PICKUP_TRUCK: { name: 'Pickup Truck', basePrice: 100, pricePerKm: 22 },
  CONTAINER_3TON: { name: '3-Ton Container', basePrice: 200, pricePerKm: 35 },
  HEAVY_DUTY_TRUCK: { name: 'Heavy Duty Truck', basePrice: 500, pricePerKm: 60 },
};
export const MAP_DEFAULTS = {
  center: [19.0760, 72.8777] as [number, number],
  zoom: 12,
};
