import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingStatus } from '../types/booking.types';

interface BookingState {
  bookings: Booking[];
  activeBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}
const initialState: BookingState = {
  bookings: [],
  activeBooking: null,
  isLoading: false,
  error: null
};
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    bookingStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchBookingsSuccess(state, action: PayloadAction<Booking[]>) {
      state.isLoading = false;
      state.bookings = action.payload;
      state.error = null;
      const active = action.payload.find(
        (b) => !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(b.status)
      );
      if (active) {
        state.activeBooking = active;
      }
    },
    createBookingSuccess(state, action: PayloadAction<Booking>) {
      state.isLoading = false;
      state.bookings.unshift(action.payload);
      state.activeBooking = action.payload;
    },
    bookingFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setActiveBooking(state, action: PayloadAction<Booking | null>) {
      state.activeBooking = action.payload;
    },
    updateBookingStatus(state, action: PayloadAction<{
      id: string;
      status: BookingStatus;
      driverId?: string | null;
    }>) {
      const { id, status, driverId } = action.payload;

      const idx = state.bookings.findIndex((b) => b.id === id);
      if (idx !== -1) {
        state.bookings[idx].status = status;
        if (driverId !== undefined) state.bookings[idx].driverId = driverId;
      }
      if (state.activeBooking && state.activeBooking.id === id) {
        state.activeBooking.status = status;
        if (driverId !== undefined) state.activeBooking.driverId = driverId;
      }
      if (['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(status)) {
        state.activeBooking = null;
      }

    },
    clearBookingError(state) { state.error = null; },
    resetBookingState(state) {
      state.bookings = [];
      state.activeBooking = null;
      state.isLoading = false;
      state.error = null;
    }
  },
});
export const {
  bookingStart,
  fetchBookingsSuccess,
  createBookingSuccess,
  bookingFailure,
  setActiveBooking,
  updateBookingStatus,
  clearBookingError,
  resetBookingState,
} = bookingSlice.actions;
export default bookingSlice.reducer;
