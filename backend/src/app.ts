import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);


app.get('/api/bookings', (req, res) => {
    res.json({ status: 'auth working' });
});

const PORT = process.env.port || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});