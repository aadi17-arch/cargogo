import { GeocodingProvider } from './provider';
import prisma from '../../config/database';

export class LocalDbProvider extends GeocodingProvider {
  name = 'LocalDB';
  timeoutMs = 1000;

  async reverse(lat: number, lng: number): Promise<string | null> {
    try {
      const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
      const cached = await prisma.geocodeCache.findUnique({
        where: { query: cacheKey }
      });
      return cached ? cached.displayName : null;
    } catch {
      return null;
    }
  }
}
