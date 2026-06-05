import { Router } from "express";
import { register, login, getMe ,refresh,logout} from "@/controllers/auth.controller";
import { authenticate } from '@/middleware/auth.middleware';
import { validateRequest } from "@/middleware/validate.middleware";
import { registerSchema,loginSchema } from "@/validations/auth.validation";

const r = Router();
r.post('/register', validateRequest(registerSchema), register);
r.post('/login', validateRequest(loginSchema), login);
r.post('/refresh', refresh);
r.post('/logout', logout);
r.post('/me', authenticate, getMe);

export default r;
