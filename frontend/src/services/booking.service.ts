import api from './api';
import { Booking, CreateBookingRequest } from '../types/booking.types';
import { ApiResponse } from '../types/api.types';

export const bookingService = {
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await api.post<ApiResponse<any>>('/bookings/createBooking', data);
    return response.data.data.booking;
  },

  async getMyBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/my');
    return response.data.data!;
  },

  async getPendingBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/pending');
    return response.data.data!;
  },

  async getBookingById(id: string): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data.data!;
  },

  async acceptBooking(id: string): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`/bookings/${id}/accept`);
    return response.data.data!;
  },

  async confirmPickup(id: string, otp: string): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`/bookings/${id}/pickup`, { otp });
    return response.data.data!;
  },

  async confirmDropoff(id: string, otp: string): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`/bookings/${id}/dropoff`, { otp });
    return response.data.data!;
  },

  async completeBooking(id: string): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`/bookings/${id}/complete`);
    return response.data.data!;
  },

  async getInvoice(id: string): Promise<any> {
    const response = await api.get<ApiResponse<any>>(`/bookings/${id}/invoice`);
    return response.data.data!;
  },
};
