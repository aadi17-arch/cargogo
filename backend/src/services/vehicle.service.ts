import prisma from "@/config/database";
interface updateVehicleInput {
  type?: 'TWO_WHEELER' | 'THREE_WHEELER' | 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON' | 'HEAVY_DUTY_TRUCK';
  plateNumber?: string;
  capacityKg?: number;
  basePrice?: number;
  pricePerKm?: number;
  costPerUnit?: number;
}
export const getVehicleByUserId = async (
  userId: string
) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { userId: userId }
  });
  return vehicle;
};
export const updateVehicle = async (
  userId: string,
  updateInput: updateVehicleInput
) => {
  if (!updateInput.plateNumber) {
    const existing = await prisma.vehicle.findUnique({ where: { userId } });
    if (!existing) {
      throw new Error('Plate number is required to register a vehicle');
    }
  }

  const updatedVehicle = await prisma.vehicle.upsert({
    where: { userId: userId },
    create: {
      userId: userId,
      type: updateInput.type || 'MINI_TEMPO',
      plateNumber: updateInput.plateNumber!,
      capacityKg: updateInput.capacityKg || 1000,
      basePrice: updateInput.basePrice || 50,
      pricePerKm: updateInput.pricePerKm || 15,
      costPerUnit: updateInput.costPerUnit || 5,
    },
    update: updateInput
  });
  return updatedVehicle;
};
