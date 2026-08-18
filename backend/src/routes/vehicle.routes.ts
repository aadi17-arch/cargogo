import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { getDriverVehicle, updateDriverProfile } from "@/controllers/vehicle.controller";
import { requiredRole } from "@/middleware/role.middleware";
import { validateRequest } from "@/middleware/validate.middleware";
import { updateVehicleSchema } from "@/validations/vehicle.validation";

const r = Router();

r.get('/me', authenticate, requiredRole('DRIVER'), getDriverVehicle);
r.put('/update', authenticate, requiredRole('DRIVER'), validateRequest(updateVehicleSchema), updateDriverProfile);

export default r;
