import { Request, Response } from "express";
import { registerUser, loginUser } from "@/services/auth.service";
import { catchAsync } from "@/utils/catchAsync";
import { verifyRefreshToken, generateAccessToken } from "@/utils/jwt";
import { AppError } from "@/utils/AppError";
import prisma from "@/config/database";
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000
}
export const register = catchAsync(async (req: Request, res: Response) => {

    const result = await registerUser(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
        success: true,
        data: {
            user: result.user,
            token:result.accessToken
        }
    });

});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      token: result.accessToken
    }
  });
});
export const refresh = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new AppError('Refresh token not found', 401);
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
        throw new AppError('Invalid or expired refresh Token', 401);
    }
    const session = await prisma.session.findUnique({
        where: { refreshToken }
    });
    if (!session || session.expiresAt < new Date()) {
        if (session) await prisma.session.delete({
            where: { refreshToken }
        });
        throw new AppError('Session expired or revoked', 401);
    }
    const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
    });
    res.status(200).json({
        success: true,
        data: {
            token:newAccessToken
        }
    });
});
export const logout = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) await prisma.session.deleteMany({ where: { refreshToken } });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ success: true, data: req.user });
});
export const getMe = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: (req as any).user });
}
