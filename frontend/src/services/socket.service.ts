import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  private socket: Socket | null = null;
  private listeners: { event: string; callback: (data: any) => void }[] = [];
  private activeRooms: Set<string> = new Set();

  get isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    this.listeners.forEach(({ event, callback }) => {
      this.socket?.on(event, callback);
    });

    this.socket.on('connect', () => {
      // Re-join active tracking rooms on reconnect
      this.activeRooms.forEach((bookingId) => {
        this.socket?.emit('track-booking', { bookingId });
      });
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }

  joinRoom(bookingId: string) {
    if (bookingId) {
      this.activeRooms.add(bookingId);
      this.emit('track-booking', { bookingId });
    }
  }

  leaveRoom(bookingId: string) {
    if (bookingId) {
      this.activeRooms.delete(bookingId);
      this.emit('leave-booking', { bookingId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.activeRooms.clear();
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

  
  bookCargo(bookingId: string) {
    this.emit('book-cargo', { bookingId });
  }

  
  acceptBid(bookingId: string) {
    this.emit('accept-bid', { bookingId });
  }

  
  rejectBid(bookingId: string) {
    this.emit('reject-bid', { bookingId });
  }

  
  updateLocation(lat: number, lng: number) {
    this.emit('driver:location', { lat, lng });
  }

  
  commitScheduledJob(bookingId: string) {
    this.emit('commit-scheduled-job', { bookingId });
  }
}

export const socketService = new SocketService();
