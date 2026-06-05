import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { getDriverVehicle,updateDriverProfile } from "@/controllers/vehicle.controller";
import { requiredRole } from "@/middleware/role.middleware";
const r = Router();

r.get('/me', authenticate, requiredRole('DRIVER'), getDriverVehicle);
r.put('/update', authenticate, requiredRole('DRIVER'), updateDriverProfile);

export default r;
