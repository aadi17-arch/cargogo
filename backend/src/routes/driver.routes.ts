import { Router } from 'express';
import { setOnline, setLocation } from '@/controllers/driver.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
const r = Router();

r.post('/online', authenticate, requiredRole('DRIVER'), setOnline);
r.post('/location', authenticate, requiredRole('DRIVER'), setLocation);

export default r;
