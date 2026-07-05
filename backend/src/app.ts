import express from 'express';
import cors from 'cors';
import { env } from '@/config/env.config';
import http from 'http';
import authRoutes from '@/routes/auth.routes';
import bookingRoutes from '@/routes/booking.routes';
import driverRoutes from '@/routes/driver.routes';
import { createSocketServer } from '@/sockets/socket.server';
import { registerMatchingHandlers } from '@/sockets/matching.socket';
import { registerTrackingHandlers } from '@/sockets/tracking.socket';
import { startDispatchWorker } from '@/queues/dispatch.queue';
import reviewRoutes from '@/routes/review.routes';
import disputeRoutes from '@/routes/dispute.routes';
import vehicleRoutes from '@/routes/vehicle.routes';
import paymentRoutes from '@/routes/payment.routes';
import geocodingRoutes from '@/routes/geocoding.routes';
import { errorHandler } from '@/middleware/error.middleware';
import helmet from 'helmet';
import { globalRateLimiter, strictLimiter } from '@/middleware/rate-limit.middleware';
import cookieParser from 'cookie-parser';
import { requestLogger } from '@/middleware/logger.middleware';

const PORT = env.PORT;

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.1.9:3000',
  'http://localhost:5173',
];

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
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
app.use(errorHandler);


app.get('/api/bookings', (req, res) => {
    res.json({ status: 'auth working' });
});

const io = createSocketServer(httpServer);
registerMatchingHandlers(io);
registerTrackingHandlers(io);
const dispatchWorker = startDispatchWorker(io);
app.set('io', io);

httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

// Import connections for graceful shutdown
import prisma from '@/config/database';
import { redis } from '@/config/redis';
import { dispatchQueue } from '@/queues/dispatch.queue';

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  httpServer.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      // Disconnect Prisma
      await prisma.$disconnect();
      console.log('Database client disconnected.');
      
      // Disconnect Redis
      await redis.quit();
      console.log('Redis client disconnected.');
      
      // Close BullMQ Queue
      await dispatchQueue.close();
      console.log('BullMQ dispatch queue closed.');

      // Close BullMQ Worker
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
