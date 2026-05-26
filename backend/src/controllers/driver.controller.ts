import { Request, Response } from "express";
import { toggleOnline,updateLocation } from "@/services/driver.service";

export const setOnline = async (
  req: Request,
  res: Response
) => {
  try {
    const { isOnline, lat, lng } = req.body;
    const result = await toggleOnline(req.user.id, isOnline,lat, lng);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};
export const setLocation = async (
  req: Request,
  res: Response
) => {
  try {
    const { lat, lng } = req.body;
    const result = await updateLocation(req.user.id, lng, lat);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(400).json({ success: true, message: e.message });
  }
}
