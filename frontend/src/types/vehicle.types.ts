export type VehicleType =
  | 'TWO_WHEELER'
  | 'THREE_WHEELER'
  | 'MINI_TEMPO'
  | 'PICKUP_TRUCK'
  | 'CONTAINER_3TON'
  | 'HEAVY_DUTY_TRUCK';

export interface Vehicle {
  id: string;
  userId: string;
  type: VehicleType;
  plateNumber: string;
  capacityKg: number;
  basePrice: number;
  pricePerKm: number;
  costPerUnit: number;
}
