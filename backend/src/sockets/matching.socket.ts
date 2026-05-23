// import { SocketIOServer } from 'socket.io';
import { findNearbyDrivers, acceptBooking } from '@/services/matching.service';
import prisma from '@/config/database';

const activeTimers = new Map<string, NodeJS.Timeout>();
export const registerMatchHandlers = (
    // io: SocketIOServer
) => {

}
