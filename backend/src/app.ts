import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env.config';
import authRoutes from '@/routes/auth.routes';
import bookingRoutes from '@/routes/booking.routes';
import driverRoutes from '@/routes/driver.routes';
import reviewRoutes from '@/routes/review.routes';
import disputeRoutes from '@/routes/dispute.routes';
import vehicleRoutes from '@/routes/vehicle.routes';
import paymentRoutes from '@/routes/payment.routes';
import geocodingRoutes from '@/routes/geocoding.routes';
import chatRoutes from '@/routes/chat.routes';
import { createSocketServer } from '@/sockets/socket.server';
import { registerMatchingHandlers } from '@/sockets/matching.socket';
import { registerTrackingHandlers } from '@/sockets/tracking.socket';
import { startDispatchWorker, dispatchQueue } from '@/queues/dispatch.queue';
import { errorHandler } from '@/middleware/error.middleware';
import { globalRateLimiter, strictLimiter } from '@/middleware/rate-limit.middleware';
import { requestLogger } from '@/middleware/logger.middleware';
import prisma from '@/config/database';
import { redis } from '@/config/redis';

const PORT = env.PORT;

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(helmet());
app.use(globalRateLimiter);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'CargoGo API is running',
        environment: env.NODE_ENV,
        health: '/api/health'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', strictLimiter, authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/payment', strictLimiter, paymentRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/chat', chatRoutes);

// Explicit 404 JSON response for any unrecognized /api endpoints
app.all('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  // DON'T REMOVE THIS — fixes the 404 refresh bug in React router
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.use(errorHandler);

const io = createSocketServer(httpServer);
registerMatchingHandlers(io);
registerTrackingHandlers(io);
const dispatchWorker = startDispatchWorker(io);
app.set('io', io);

httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  httpServer.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      console.log('Database client disconnected.');
      
      await redis.quit();
      console.log('Redis client disconnected.');
      
      await dispatchQueue.close();
      console.log('BullMQ dispatch queue closed.');
 
      if (dispatchWorker) {
        await dispatchWorker.close();
        console.log('BullMQ dispatch worker closed.');
      }
      
      console.log('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
