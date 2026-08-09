import { Router, Request, Response } from 'express';
import { resolveAddressChain } from '../services/geocoding/orchestrator';

const router = Router();

router.get('/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: "lat and lng are required" });

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  try {
    const displayName = await resolveAddressChain(latitude, longitude);
    return res.json({
      success: true,
      data: {
        display_name: displayName,
        lat: String(latitude),
        lng: String(longitude)
      }
    });
  } catch (error) {
    console.error('decoding route error:', error);
    const fallbackName = `Location(${latitude.toFixed(4)},${longitude.toFixed(4)})`;
    return res.json({
      success: true,
      data: {
        display_name: fallbackName,
        lat: String(latitude),
        lng: String(longitude)
      }
    });
  }
});

export default router;
