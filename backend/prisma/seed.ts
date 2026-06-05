/// <reference types="node" />

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  await prisma.session.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  console.log('Seeding mock data...');

  // 1. Create Shippers
  const shipper1 = await prisma.user.create({
    data: {
      email: 'shipper1@cargogo.com',
      password: hashedPassword,
      name: 'John Shipper',
      role: 'SHIPPER',
    },
  });

  const shipper2 = await prisma.user.create({
    data: {
      email: 'shipper2@cargogo.com',
      password: hashedPassword,
      name: 'Alice Shipper',
      role: 'SHIPPER',
    },
  });

  // 2. Create Drivers with Profiles and Vehicles
  const driver1 = await prisma.user.create({
    data: {
      email: 'driver1@cargogo.com',
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
        },
      },
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'driver2@cargogo.com',
      password: hashedPassword,
      name: 'David Driver',
      role: 'DRIVER',
      vehicle: {
        create: {
          type: 'PICKUP_TRUCK',
          plateNumber: 'MH-12-CD-5678',
          capacityKg: 2000,
        },
      },
      driverProfile: {
        create: {
          isOnline: true,
        },
      },
    },
  });

  console.log('🚀 Database seeded successfully!');
  console.log('Created Shippers:', [shipper1.email, shipper2.email]);
  console.log('Created Drivers:', [driver1.email, driver2.email]);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
