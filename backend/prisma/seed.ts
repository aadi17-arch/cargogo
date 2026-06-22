import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  await prisma.session.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 12);

  console.log('Seeding shippers and drivers...');

  // 1. Create Shippers
  const shipper1 = await prisma.user.create({
    data: {
      email: 's1@g.com',
      password: hashedPassword,
      name: 'John Shipper',
      role: 'SHIPPER',
    },
  });

  const shipper2 = await prisma.user.create({
    data: {
      email: 's2@g.com',
      password: hashedPassword,
      name: 'Alice Shipper',
      role: 'SHIPPER',
    },
  });

  // 2. Create Driver with vehicle MH-12-AB-1234 (1000kg capacity)
  const driver1 = await prisma.user.create({
    data: {
      email: 'd1@g.com',
      password: hashedPassword,
      name: 'Robert Driver',
      role: 'DRIVER',
      vehicle: {
        create: {
          type: 'MINI_TEMPO',
          plateNumber: 'MH-12-AB-1234',
          capacityKg: 1000,
        },
      },
      driverProfile: {
        create: {
          isOnline: true,
          latitude: 19.0760, // Center of Mumbai
          longitude: 72.8777,
        },
      },
    },
  });

  console.log('Seeding active VRP bookings with OTPs...');

  // Booking A: ACCEPTED (Needs pickup then dropoff). Weight: 300kg
  await prisma.booking.create({
    data: {
      shipperId: shipper1.id,
      driverId: driver1.id,
      status: 'ACCEPTED',
      pickupLat: 19.1000,
      pickupLng: 72.8800,
      dropoffLat: 19.1500,
      dropoffLng: 72.9000,
      cargoType: 'Electronics Pack A',
      weightKg: 300,
      lengthCm: 120,
      widthCm: 80,
      heightCm: 60,
      volumetricWeight: 11.52,
      vehicleType: 'MINI_TEMPO',
      distanceKm: 6.0,
      price: 320,
      pickupOTP: '111111',
      dropoffOTP: '222222',
      pickupAddress: 'Lalpur, Ranchi, Jharkhand',
      dropoffAddress: 'Kanke, Ranchi, Jharkhand',
    }
  });

  // Booking B: ACCEPTED (Needs pickup then dropoff). Weight: 400kg
  await prisma.booking.create({
    data: {
      shipperId: shipper1.id,
      driverId: driver1.id,
      status: 'ACCEPTED',
      pickupLat: 19.0800,
      pickupLng: 72.8600,
      dropoffLat: 19.1200,
      dropoffLng: 72.8900,
      cargoType: 'Office Furniture',
      weightKg: 400,
      lengthCm: 150,
      widthCm: 100,
      heightCm: 90,
      volumetricWeight: 27.0,
      vehicleType: 'MINI_TEMPO',
      distanceKm: 5.5,
      price: 450,
      pickupOTP: '333333',
      dropoffOTP: '444444',
      pickupAddress: 'Kanke, Ranchi, Jharkhand',
      dropoffAddress: 'Argora, Ranchi, Jharkhand',
    }
  });

  // Booking C: IN_TRANSIT (Already picked up, only needs dropoff). Weight: 200kg
  await prisma.booking.create({
    data: {
      shipperId: shipper2.id,
      driverId: driver1.id,
      status: 'IN_TRANSIT',
      pickupLat: 19.0700,
      pickupLng: 72.8500,
      dropoffLat: 19.2000,
      dropoffLng: 72.9500,
      cargoType: 'Medical Vaccines Box',
      weightKg: 200,
      lengthCm: 100,
      widthCm: 60,
      heightCm: 50,
      volumetricWeight: 6.0,
      vehicleType: 'MINI_TEMPO',
      distanceKm: 18.0,
      price: 890,
      pickupOTP: '555555',
      dropoffOTP: '666666',
      pickupVerified: true,
      pickupAddress: 'Argora, Ranchi, Jharkhand',
      dropoffAddress: 'Lalpur, Ranchi, Jharkhand',
    }
  });

  console.log('🚀 Database seeded successfully!');
  console.log('Shpr credentials: s1@g.com / 123456');
  console.log('Drvr credentials: d1@g.com / 123456');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
