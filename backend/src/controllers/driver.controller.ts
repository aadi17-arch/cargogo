import { Request, Response } from "express";
import { toggleOnline,updateLocation } from "@/services/driver.service";
import { catchAsync } from "@/utils/catchAsync";

export const setOnline = catchAsync(async (req: Request, res: Response) => {
  const { isOnline, lat, lng } = req.body;
  const result = await toggleOnline(req.user.id, isOnline,lat, lng);
  res.json({ success: true, data: result });
});

export const setLocation = catchAsync(async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  const result = await updateLocation(req.user.id, lng, lat);
  res.json({ success: true, data: result });
});
