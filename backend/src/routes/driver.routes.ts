import { Router } from 'express';
import { setOnline, setLocation, getRoute, triggerScheduledMatch } from '@/controllers/driver.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
const r = Router();

r.post('/online', authenticate, requiredRole('DRIVER'), setOnline);
r.post('/location', authenticate, requiredRole('DRIVER'), setLocation);

r.get('/route', authenticate, requiredRole('DRIVER'), getRoute);

// NEW: Admin/testing endpoint to manually trigger the scheduled pool matching engine
r.post('/trigger-scheduled-match', authenticate, triggerScheduledMatch);

export default r;
