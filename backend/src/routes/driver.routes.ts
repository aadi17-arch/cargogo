import { Router } from 'express';
import { setOnline, setLocation, getRoute, triggerScheduledMatch, getOnlineDriversController } from '@/controllers/driver.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requiredRole } from '@/middleware/role.middleware';
const r = Router();

r.get('/online-drivers', getOnlineDriversController);
r.post('/online', authenticate, requiredRole('DRIVER'), setOnline);
r.post('/location', authenticate, requiredRole('DRIVER'), setLocation);

r.get('/route', authenticate, requiredRole('DRIVER'), getRoute);


r.post('/trigger-scheduled-match', authenticate, requiredRole('ADMIN'),triggerScheduledMatch);

export default r;
