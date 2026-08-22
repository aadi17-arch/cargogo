import { Server as SocketIOServer } from 'socket.io';
export { SocketIOServer };
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '@/utils/jwt';
import { isBlacklisted } from '@/services/token-blacklist.service';
import { env } from '@/config/env.config';
import prisma from '@/config/database';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

export const createSocketServer = (httpServer: HTTPServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:5173',
                env.FRONTEND_URL,
            ].filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('Socket.io Redis adapter connected & configured successfully');
    }).catch((e) => {
        console.error('Socket.io redis adapter failed to connect:', e);
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) throw new Error('No token provided');
            if (await isBlacklisted(token)) throw new Error('Token has been invalidated');

            const decoded = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    driverProfile: true,
                    vehicle: true
                }
            });
            if (!user) throw new Error('User not found');
            socket.data.user = user;
            next();
        } catch (e: any) {
            next(new Error('Auth failed: ' + e.message));
        }
    });
    return io;
};
