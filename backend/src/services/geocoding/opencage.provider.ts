import { GeocodingProvider } from './provider';

export class OpenCageProvider extends GeocodingProvider {
  name = 'OpenCage';
  timeoutMs = 3000;
  private apiKey = process.env.OPENCAGE_API_KEY;

  async reverse(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) return null;
    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${this.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.results?.[0]?.formatted || null;
    } catch {
      return null;
    }
  }
}
