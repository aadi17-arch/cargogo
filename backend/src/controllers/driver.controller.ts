import { Request, Response } from "express";
import { toggleOnline, updateLocation, getOnlineDrivers } from "@/services/driver.service";
import { OptimizedRoute } from "@/services/vrp.service";
import { processScheduledPool } from "@/services/scheduled-jobs.service";
import { catchAsync } from "@/utils/catchAsync";

export const setOnline = catchAsync(async (req: Request, res: Response) => {
  const { isOnline, latitude, longitude } = req.body;
  const result = await toggleOnline(req.user!.id, isOnline, latitude, longitude);
  res.json({ success: true, data: result });
});

export const setLocation = catchAsync(async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  const result = await updateLocation(req.user!.id, latitude, longitude);
  res.json({ success: true, data: result });
});

export const getRoute = catchAsync(async (req: Request, res: Response) => {
  const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
  const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;

  const result = await OptimizedRoute(req.user!.id, lat, lng);
  res.json({ success: true, data: result });
});

export const getOnlineDriversController = catchAsync(async (req: Request, res: Response) => {
  const drivers = await getOnlineDrivers();
  res.json({ success: true, data: drivers });
});


export const triggerScheduledMatch = catchAsync(async (req: Request, res: Response) => {
  const io = req.app.get('io');
  await processScheduledPool(io);
  res.json({ success: true, message: 'Scheduled pool processed successfully' });
});
