import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { bookingService } from '../services/booking.service';
import {
  bookingStart,
  fetchBookingsSuccess,
  createBookingSuccess,
  bookingFailure,
  updateBookingStatus,
  clearBookingError,
  resetBookingState,
} from '../store/booking.slice';
import { CreateBookingRequest, BookingStatus } from '../types/booking.types';

const getErrMsg = (err: any, fallback: string): string =>
  err?.response?.data?.message || fallback;

export const useBooking = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { bookings, activeBooking, isLoading, error } = useSelector(
    (state: RootState) => state.booking
  );

    const withLoading = async <T>(fn: () => Promise<T>, errMsg: string): Promise<T> => {
    dispatch(bookingStart());
    try {
      return await fn();
    } catch (err: any) {
      dispatch(bookingFailure(getErrMsg(err, errMsg)));
      throw err;
    }
  };

  const fetchMyBookings = () =>
    withLoading(async () => {
      const data = await bookingService.getMyBookings();
      dispatch(fetchBookingsSuccess(data));
      return data;
    }, 'Failed to fetch bookings');

  const createBooking = (bookingData: CreateBookingRequest) =>
    withLoading(async () => {
      const booking = await bookingService.createBooking(bookingData);
      dispatch(createBookingSuccess(booking));
      return booking;
    }, 'Failed to create booking');

  const cancelBooking = (id: string) =>
    withLoading(async () => {
      const booking = await bookingService.cancelBooking(id);
      dispatch(updateBookingStatus({ id, status: 'CANCELLED' as BookingStatus }));
      return booking;
    }, 'Failed to cancel booking');


  const fetchPendingBookings = async () => {
    try {
      return await bookingService.getPendingBookings();
    } catch (err: any) {
      dispatch(bookingFailure(getErrMsg(err, 'Failed to fetch pending bookings')));
      throw err;
    }
  };

  const acceptBooking = async (id: string) => {
    try {
      const booking = await bookingService.acceptBooking(id);
      dispatch(updateBookingStatus({ id, status: 'ACCEPTED' as BookingStatus }));
      return booking;
    } catch (err: any) {
      dispatch(bookingFailure(getErrMsg(err, 'Failed to accept booking')));
      throw err;
    }
  };

  const confirmPickup = async (id: string, otp: string) => {
    try {
      const booking = await bookingService.confirmPickup(id, otp);
      dispatch(updateBookingStatus({ id, status: 'IN_TRANSIT' as BookingStatus }));
      return booking;
    } catch (err: any) {
      dispatch(bookingFailure(getErrMsg(err, 'OTP verification failed')));
      throw err;
    }
  };

  const confirmDropoff = async (id: string, otp: string) => {
    try {
      const booking = await bookingService.confirmDropoff(id, otp);
      dispatch(updateBookingStatus({ id, status: 'DELIVERED' as BookingStatus }));
      return booking;
    } catch (err: any) {
      dispatch(bookingFailure(getErrMsg(err, 'Dropoff verification failed')));
      throw err;
    }
  };

  const clearError = () => dispatch(clearBookingError());
  const resetState = () => dispatch(resetBookingState());

  return {
    bookings,
    activeBooking,
    isLoading,
    error,
    fetchMyBookings,
    createBooking,
    fetchPendingBookings,
    acceptBooking,
    confirmPickup,
    confirmDropoff,
    cancelBooking,
    clearError,
    resetState,
  };
};
