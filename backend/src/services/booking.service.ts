import prisma from "@/config/database";
import { calculatePrice } from "./pricing.service";
import { generateOTP } from "./otp.service";

interface createBookingInput {
    shipperId: string,
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    cargoType: string,
    weightKg: number
    lengthCm: number;
    widthCm: number,
    heightCm: number,
    vehicleType: 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON';
}
export const createBooking = async (input: createBookingInput) => {
    const pricing = calculatePrice({
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        weightKg: input.weightKg,
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        vehicleType: input.vehicleType,
    });
    const booking = await prisma.booking.create({
        data: {
            shipperId: input.shipperId,
            pickupLat: input.pickupLat,
            pickupLng: input.pickupLng,
            dropoffLat: input.dropoffLat,
            dropoffLng: input.dropoffLng,
            cargoType: input.cargoType,
            weightKg: input.weightKg,
            lengthCm: input.lengthCm,
            widthCm: input.widthCm,
            heightCm: input.heightCm,
            volumetricWeight: pricing.volumetricWeight,
            distanceKm: pricing.distanceKm,
            price: pricing.totalPrice,
            pickupOTP: generateOTP(),
            dropoffOTP: generateOTP(),
        }
    });
    return { booking, pricing };
}
export const getBookingById = async (bookingId: string) => {
    return prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            shipper: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            driver: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }

        }
    });
};
export const getShipperBookings = async (shipperId: string) => {
    return prisma.booking.findMany({
        where: { shipperId },
        orderBy: {
            createdAt: 'desc'
        }
    });
};
export const verifyPickupOTP = async (bookingId: string, otp: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'ACCEPTED') throw new Error('Booking has not been accepted by a driver yet.');
    if (booking.pickupOTP !== otp) throw new Error('Wrong OTP');
    const updatedDeliveryStatus = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'IN_TRANSIT', pickupVerified: true }
    });
    return updatedDeliveryStatus;
};
export const verifyDropOffOTP = async (bookingId: string, otp: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'IN_TRANSIT') throw new Error('Booking not in transit');
    if (booking.dropoffOTP !== otp) throw new Error('Wrong OTP');
    const updatedDeliveryStatus = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'DELIVERED',
            dropoffVerified: true
        }
    });
    return updatedDeliveryStatus;
}