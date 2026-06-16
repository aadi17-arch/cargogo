import api from './api';
import { DriverProfile,VrpRouteResponse } from '../types/driver.types';
import { Vehicle } from '../types/vehicle.types';
import { ApiResponse } from '../types/api.types';

export const driverService = {
  async updateOnlineStatus(isOnline: boolean, latitude: number, longitude: number): Promise<DriverProfile> {
    const response = await api.post<ApiResponse<DriverProfile>>('/drivers/online', { isOnline, latitude, longitude });
    return response.data.data!;
  },

  async updateLocation(latitude: number, longitude: number): Promise<DriverProfile> {
    const response = await api.post<ApiResponse<DriverProfile>>('/drivers/location', {
      latitude,
      longitude,
    });
    return response.data.data!;
  },

  async getMyVehicle(): Promise<Vehicle> {
    const response = await api.get<ApiResponse<Vehicle>>('/vehicles/me');
    return response.data.data!;
  },

  async registerOrUpdateVehicle(vehicleData: {
    type: string;
    plateNumber: string;
    capacityKg: number;
  }): Promise<Vehicle> {
    const response = await api.put<ApiResponse<Vehicle>>('/vehicles/update', vehicleData);
    return response.data.data!;
  },

  async getOptimizedRoute(latitude?: number, longitude?: number): Promise<VrpRouteResponse>{
    const params = latitude !== undefined && longitude !== undefined ? { latitude, longitude } : {};
    const response = await api.get<ApiResponse<VrpRouteResponse>>('/drivers/route', { params });

    return response.data.data!;
  },
};
