import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { requiredRole } from "@/middleware/role.middleware";
import { checkout } from "@/controllers/payment.controller";
import { validateRequest } from "@/middleware/validate.middleware";
import { checkoutSchema } from "@/validations/payment.validation";
import { idempotency } from "@/middleware/idempotency.middleware";

const r = Router();

r.post('/checkout', authenticate, requiredRole('SHIPPER'), idempotency,validateRequest(checkoutSchema), checkout);

export default r;
