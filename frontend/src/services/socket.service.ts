import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected. Cannot emit event: ${event}`);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn(`Socket not initialized yet. Callback for ${event} might not trigger.`);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Shippers requests a new matching
  bookCargo(bookingId: string) {
    this.emit('book-cargo', { bookingId });
  }

  // Driver accepts a shipment match
  acceptBid(bookingId: string) {
    this.emit('accept-bid', { bookingId });
  }

  // Driver declines a shipment match
  rejectBid(bookingId: string) {
    this.emit('reject-bid', { bookingId });
  }

  // Driver reports live GPS coords
  updateLocation(lat: number, lng: number) {
    this.emit('driver:location', { lat, lng });
  }
}

export const socketService = new SocketService();
