import prisma from "@/config/database";
import { verifyAccessToken } from "@/utils/jwt";
import { NextFunction, Request, Response } from "express";
import { isBlacklisted } from "@/services/token-blacklist.service";
import { AuthenticatedUser } from "@/types/auth.types";

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new Error('No token provided');
        if (await isBlacklisted(token)) throw new Error('Token has been invalidated');
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
                driverProfile: true,
                vehicle: true,
            }
        });
        if (!user) throw new Error('User not found');
        req.user = user;
        next();
    } catch (e: any) {
        return res.status(401).json({ success: false, message: e.message });
    }
};
