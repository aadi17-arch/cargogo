import { Router } from 'express';
import { createDipute } from '../controllers/dispute.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';

const r = Router();

r.post('/fileDispute', authenticate, requiredRole('SHIPPER'), createDipute);

export default r;
