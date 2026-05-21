import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { authenticate } from '../middleware/auth.middleware';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.post('/me', authenticate, getMe);

export default r;