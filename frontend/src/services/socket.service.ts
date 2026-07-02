import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  private socket: Socket | null = null;
  private listeners: { event: string; callback: (data: any) => void }[] = [];

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    // Bind all registered listeners to the new socket instance
    this.listeners.forEach(({ event, callback }) => {
      this.socket?.on(event, callback);
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
    // Save listener so it can be re-bound if socket reconnects/initializes later
    this.listeners.push({ event, callback });
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    this.listeners = this.listeners.filter(
      (l) => !(l.event === event && (!callback || l.callback === callback))
    );
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
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

  // NEW: Driver commits to a scheduled job via socket
  commitScheduledJob(bookingId: string) {
    this.emit('commit-scheduled-job', { bookingId });
  }
}

export const socketService = new SocketService();
