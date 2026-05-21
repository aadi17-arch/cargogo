import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';

export const registerUser = async (data: {
    email: string;
    password: string;
    name: string;
    role: 'SHIPPER' | 'DRIVER';
    vehicle?: {
        type: 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON';
        plateNumber: string;
        capacityKg: number;
    };
}) => {
    const existing = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    });
    if (existing) throw new Error('Email already registered');
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
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    return { user, token };
}


export const loginUser = async (
    email: string,
    password: string
) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { vehicle: true, driverProfile: true }
    });
    if (!user) throw new Error('Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
    });
    return { user, token };
}