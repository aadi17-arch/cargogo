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
import { addToBlacklist } from "@/services/token-blacklist.service";

function sanitizeUser(user: any) {
    if (!user) return user;
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
}

export const register = catchAsync(async (req: Request, res: Response) => {
    if (!req.body.role || !['SHIPPER', 'DRIVER'].includes(req.body.role)) {
        req.body.role = 'SHIPPER';
    }
    const result = await registerUser(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
        success: true,
        data: {
            user: sanitizeUser(result.user),
            token: result.accessToken
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
      user: sanitizeUser(result.user),
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

    // Blacklist the current access token on logout
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        addToBlacklist(token);
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ success: true, data: sanitizeUser(req.user) });
});
export const getMe = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: sanitizeUser((req as any).user) });
}

export const resetLiveDatabase = catchAsync(async (req: Request, res: Response) => {
  const { PrismaClient } = require('@prisma/client');
  const argon2 = require('argon2');
  const tx = new PrismaClient();

  console.log('Admin clearing database...');
  await tx.session.deleteMany();
  await tx.dispute.deleteMany();
  await tx.review.deleteMany();
  await tx.payment.deleteMany();
  await tx.booking.deleteMany();
  await tx.vehicle.deleteMany();
  await tx.driverProfile.deleteMany();
  await tx.user.deleteMany();

  const hashedPassword = await argon2.hash('123456');
  const adityaPassword = await argon2.hash('mypcpubg17@');

  console.log('Admin seeding database...');
  // 1. Shippers
  const shipper1 = await tx.user.create({
    data: { email: 's1@g.com', password: hashedPassword, name: 'John Shipper', role: 'SHIPPER' }
  });
  const shipper2 = await tx.user.create({
    data: { email: 's2@g.com', password: hashedPassword, name: 'Alice Shipper', role: 'SHIPPER' }
  });

  // 2. Default Driver
  const driver1 = await tx.user.create({
    data: {
      email: 'd1@g.com',
      password: hashedPassword,
      name: 'Robert Driver',
      role: 'DRIVER',
      vehicle: { create: { type: 'MINI_TEMPO', plateNumber: 'MH-12-AB-1234', capacityKg: 1000 } },
      driverProfile: { create: { isOnline: true, latitude: 19.0760, longitude: 72.8777 } }
    }
  });

  // 3. Aditya Driver
  const adityaDriver = await tx.user.create({
    data: {
      email: 'driver_aditya@cargogo.com',
      password: adityaPassword,
      name: 'Aditya Driver',
      role: 'DRIVER',
      vehicle: { create: { type: 'MINI_TEMPO', plateNumber: 'MH-12-CG-9999', capacityKg: 1000 } },
      driverProfile: { create: { isOnline: true, latitude: 19.0760, longitude: 72.8777 } }
    }
  });

  await tx.$disconnect();
  res.json({ success: true, message: 'Database wiped and seeded with new Argon2 credentials successfully!' });
});
