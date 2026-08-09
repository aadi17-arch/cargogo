import { GeocodingProvider } from './provider';

export class MapboxProvider extends GeocodingProvider {
  name = 'Mapbox';
  timeoutMs = 3000;
  private apiKey = process.env.MAPBOX_API_KEY;

  async reverse(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.apiKey}&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.features?.[0]?.place_name || null;
    } catch {
      return null;
    }
  }
}
