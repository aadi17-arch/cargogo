import { Request, Response } from "express";
import { toggleOnline, updateLocation } from "@/services/driver.service";
import { OptimizedRoute } from "@/services/vrp.service";
import { catchAsync } from "@/utils/catchAsync";

export const setOnline = catchAsync(async (req: Request, res: Response) => {
  const { isOnline, latitude, longitude } = req.body;
  const result = await toggleOnline(req.user.id, isOnline, latitude, longitude);
  res.json({ success: true, data: result });
});

export const setLocation = catchAsync(async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  const result = await updateLocation(req.user.id, latitude, longitude);
  res.json({ success: true, data: result });
});

export const getRoute = catchAsync(async (req: Request, res: Response) => {
  const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
  const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

  const result = await OptimizedRoute(req.user.id, lat, lng);
  res.json({ success: true, data: result });
});
