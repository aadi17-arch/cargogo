import { Server as SocketIOServer } from 'socket.io';
export { SocketIOServer };
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '@/utils/jwt';
import prisma from '@/config/database';

export const createSocketServer = (httpServer: HTTPServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) throw new Error('No token');
            const decoded = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    driverProfile: true, vehicle: true
                }
            });
            if (!user) throw new Error('User not found');
            socket.data.user = user;
            next();
        } catch (e: any) {
            next(new Error('Auth failed' + e.message));
        }
    });
    return io;
};
