import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';
import driverRoutes from './routes/driver.routes';
import { createSocketServer } from './sockets/socket.server';
import { registerMatchingHandlers } from './sockets/matching.socket';
import { registerTrackingHandlers } from './sockets/tracking.socket';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);




app.get('/api/bookings', (req, res) => {
    res.json({ status: 'auth working' });
});

const io = createSocketServer(httpServer);
registerMatchingHandlers(io);
registerTrackingHandlers(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
