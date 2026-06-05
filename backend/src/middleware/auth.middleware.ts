import prisma from "@/config/database";
import { verifyAccessToken } from "@/utils/jwt";
import { NextFunction, Request, Response } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new Error('No token provided');
        const decoded = verifyAccessToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                vehicle: true,
                driverProfile: true
            }
        });
        if (!user) throw new Error('User not found');
        req.user = user;
        next();


    } catch (e: any) {
        return res.status(401).json({ success: false, message: e.message });
    }
};
