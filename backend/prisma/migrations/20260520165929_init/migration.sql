-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SHIPPER', 'DRIVER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MINI_TEMPO', 'PICKUP_TRUCK', 'CONTAINER_3TON');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "capacityKg" INTEGER NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "pricePerKm" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "costPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 5,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "shipperId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "cargoType" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "lengthCm" DOUBLE PRECISION NOT NULL,
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "volumetricWeight" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pickupOTP" TEXT,
    "dropoffOTP" TEXT,
    "pickupVerified" BOOLEAN NOT NULL DEFAULT false,
    "dropoffVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_userId_key" ON "driver_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_userId_key" ON "vehicles"("userId");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
