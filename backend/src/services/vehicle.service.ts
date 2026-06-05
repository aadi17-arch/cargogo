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
  const updatedVehicle = await prisma.vehicle.update({
    where: { userId: userId },
    data: updateInput
  });
  return updatedVehicle;
}
