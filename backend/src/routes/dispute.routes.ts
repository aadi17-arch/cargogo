import { Router } from 'express';
import { createDipute } from '@/controllers/dispute.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
import { validateRequest } from '@/middleware/validate.middleware';
import { fileDisputeSchema } from '@/validations/review.validation';


const r = Router();

r.post('/fileDispute', authenticate, requiredRole('SHIPPER'),validateRequest(fileDisputeSchema), createDipute);

export default r;
