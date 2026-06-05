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
import { errorHandler } from '@/middleware/error.middleware';
import helmet from 'helmet';
import { globalRateLimiter, strictLimiter } from '@/middleware/rate-limit.middleware';
import cookieParser from 'cookie-parser';
import { requestLogger } from '@/middleware/logger.middleware';

const PORT = env.PORT;

const app = express();
const httpServer = http.createServer(app);

app.use(cors({
    origin: env.NODE_ENV === 'production' ? 'https://cargogo-frontend.vercel.app' : 'http://localhost:5173',
    credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use(globalRateLimiter);
app.use('/api/auth',strictLimiter, authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/payment', strictLimiter,paymentRoutes);
app.use(errorHandler);


app.get('/api/bookings', (req, res) => {
    res.json({ status: 'auth working' });
});

const io = createSocketServer(httpServer);
registerMatchingHandlers(io);
registerTrackingHandlers(io);
startDispatchWorker(io);
app.set('io', io);

httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
