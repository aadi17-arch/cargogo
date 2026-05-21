import { Request, Response } from "express";
import { registerUser, loginUser } from "@/services/auth.service";

export const register = async (req: Request, res: Response) => {
    try {
        const result = await registerUser(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.status(200).json({ success: true, data: result });
    } catch (e: any) {
        res.status(401).json({ success: false, message: e.message });
    }
}

export const getMe = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: (req as any).user });
}