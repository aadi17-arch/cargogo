import { Request, Response } from "express";
import { getVehicleByUserId, updateVehicle } from "@/services/vehicle.service";
import { catchAsync } from "@/utils/catchAsync";

export const getDriverVehicle = catchAsync(async (req: Request, res: Response) => {
  const vehicle = await getVehicleByUserId(req.user!.id);
  res.status(200).json({ success: true, data: vehicle });
});

export const updateDriverProfile = catchAsync(async (req: Request, res: Response) => {
  const updateStats = await updateVehicle(req.user!.id, req.body);
  res.status(200).json({ success: true, data: updateStats });
});
