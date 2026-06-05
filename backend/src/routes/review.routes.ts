import { Router } from 'express';
import { createdReview } from '@/controllers/review.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
import { validateRequest } from '@/middleware/validate.middleware';
import { createReviewSchema } from '@/validations/review.validation';

const r = Router();

r.post('/createReview', authenticate, requiredRole('SHIPPER'), validateRequest(createReviewSchema), createdReview);

export default r;
