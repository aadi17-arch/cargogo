import { Router } from 'express';
import { createdReview } from '../controllers/review.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';

const r = Router();
r.post('/createReview', authenticate, requiredRole('SHIPPER'), createdReview);

export default r;
