import { useEffect, useCallback } from 'react';
import { socketService } from '@/services/socket.service';

export const useSocket = (token?: string | null) => {
  useEffect(() => {
    if (token) socketService.connect(token);

    return () => { };
  }, []);
  const connect = useCallback((userToken: string) => {
    socketService.connect(userToken);
  }, []);
  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);
  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);
  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketService.on(event, callback);
    return () => {
      socketService.off(event, callback);
    };
  }, []);
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    socketService.off(event, callback);
  }, []);
  const bookCargo = useCallback((bookingId: string) => {
    socketService.bookCargo(bookingId);
  }, []);
  const acceptBid = useCallback((bookingId: string) => {
    socketService.acceptBid(bookingId);
  },[]);
  const rejectBid = useCallback((bookingId: string) => {
    socketService.rejectBid(bookingId);
  }, []);
  const updateLocation = useCallback((lat: number, lng: number) => {
    socketService.updateLocation(lat, lng);
  }, []);

  return {
    connect,
    disconnect,
    emit,
    on,
    off,
    bookCargo,
    acceptBid,
    rejectBid,
    updateLocation,
  }
}
