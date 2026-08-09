import { Router, Request, Response } from 'express';
import  prisma from '../config/database.js';

const router = Router();

router.get('/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: "lat and lng are required" });

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const cacheKey = `rev:${latitude.toFixed(4)},${longitude.toFixed(4)}`; // ek generalized key

  try {
    const cached = await prisma.geocodeCache.findUnique({
      where: { query: cacheKey }
    });
    if (cached) {
      console.log('Cache Hit:', cacheKey);
      return res.json({
        success: true,
        data: {
          display_name: cached.displayName,
          lat: String(latitude),
          lng: String(longitude)
        }
      });
    }
    let displayName = '';
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

    const response = await fetch(bdcUrl, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json() as any;
      const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
      displayName = parts.join(', ');
    }

    if (!displayName) {
      displayName = `Location(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
    await prisma.geocodeCache.create({
      data: {
        query: cacheKey,
        displayName,
        latitude,
        longitude
      }
    }).catch(err => console.warn('Cache write failed', err));

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
