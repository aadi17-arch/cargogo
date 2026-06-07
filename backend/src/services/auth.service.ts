import bcrypt from 'bcryptjs';
import prisma from '@/config/database';
import { generateAccessToken,generateRefreshToken } from '@/utils/jwt';
import { AppError } from '@/utils/AppError';

export const registerUser = async (data: {
    email: string;
    password: string;
    name: string;
    role: 'SHIPPER' | 'DRIVER';
    vehicle?: {
        type: 'TWO_WHEELER' | 'THREE_WHEELER' | 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON' | 'HEAVY_DUTY_TRUCK';
        plateNumber: string;
        capacityKg: number;
    };
}) => {
    const existing = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    });
    if (existing) throw new AppError('Email already registered', 400);
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role,
            ...(data.role === 'DRIVER' && data.vehicle
                ? {
                    vehicle: { create: data.vehicle },
                    driverProfile: { create: { isOnline: false } },
                }
                : {}),
        },
        include: {
            vehicle: true,
            driverProfile: true,
        },
    });
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt,
        },
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
}


export const loginUser = async (
    email: string,
    password: string
) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { vehicle: true, driverProfile: true }
    });
    if (!user) throw new AppError('Invalid credentials', 401);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
    });
    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt,
        },
    });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken,refreshToken };
}
