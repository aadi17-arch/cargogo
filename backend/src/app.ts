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
import path from 'path';
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/payment', strictLimiter, paymentRoutes);
app.use('/api/geocoding', geocodingRoutes);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  // DON'T REMOVE THIS — fixes the 404 refresh bug in React router
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

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

// close connections cleanly when stopping the process
import prisma from '@/config/database';
import { redis } from '@/config/redis';
import { dispatchQueue } from '@/queues/dispatch.queue';

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
