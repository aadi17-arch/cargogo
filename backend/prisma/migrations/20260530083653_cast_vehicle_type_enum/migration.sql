-- Step 1: Drop the temporary TEXT default before casting
ALTER TABLE "bookings" ALTER COLUMN "vehicleType" DROP DEFAULT;

-- Step 2: Cast from TEXT to the VehicleType enum
ALTER TABLE "bookings" ALTER COLUMN "vehicleType" TYPE "VehicleType" USING "vehicleType"::"VehicleType";
