import { Router } from "express";
import { register, login, getMe ,refresh,logout, resetLiveDatabase} from "@/controllers/auth.controller";
import { authenticate } from '@/middleware/auth.middleware';
import { validateRequest } from "@/middleware/validate.middleware";
import { registerSchema,loginSchema } from "@/validations/auth.validation";

const r = Router();
r.post('/register', validateRequest(registerSchema), register);
r.post('/login', validateRequest(loginSchema), login);
r.post('/refresh', refresh);
r.post('/logout', logout);
r.get('/me', authenticate, getMe);
r.post('/admin-reset-db', resetLiveDatabase);

export default r;
