import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { requiredRole } from "@/middleware/role.middleware";
import { checkout } from "@/controllers/payment.controller";
import { validateRequest } from "@/middleware/validate.middleware";
import { checkoutSchema } from "@/validations/payment.validation";

const r = Router();

r.post('/checkout', authenticate, requiredRole('SHIPPER'), validateRequest(checkoutSchema), checkout);

export default r;
