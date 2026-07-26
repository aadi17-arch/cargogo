import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { getChatHistory } from "@/controllers/chat.controller";

const r = Router();

r.get("/:bookingId", authenticate, getChatHistory);

export default r;
