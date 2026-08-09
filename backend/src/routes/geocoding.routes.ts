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

router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: "Query q is required" });

  try {
    // Try Nominatim Search
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&limit=5`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CargoGo/1.0' },
      signal: AbortSignal.timeout(4000)
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, data });
    }

    // Fallback to Photon Search
    const photonUrl = `https://photon.komoot.io/api?q=${encodeURIComponent(q as string)}&limit=5`;
    const photonResponse = await fetch(photonUrl, { signal: AbortSignal.timeout(4000) });

    if (photonResponse.ok) {
      const data = await photonResponse.json() as any;
      const mapped = (data.features || []).map((feat: any) => {
        const p = feat.properties;
        const name = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ');
        return {
          display_name: name,
          lat: String(feat.geometry.coordinates[1]),
          lon: String(feat.geometry.coordinates[0])
        };
      });
      return res.json({ success: true, data: mapped });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Search route error:', error);
    return res.json({ success: true, data: [] });
  }
});

export default router;
