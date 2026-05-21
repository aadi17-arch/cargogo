import { Request, Response, NextFunction } from "express";

export const requiredRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!(req as any).user)
            return res.status(401).json({ success: false, message: 'User not found' });
        if (!roles.includes((req as any).user.role))
            return res.status(403).json({ success: false, message: 'Access denied' });
        next();
    }

}