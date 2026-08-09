import { GeocodingProvider } from './provider';

export class NominatimProvider extends GeocodingProvider {
  name = 'Nominatim';
  timeoutMs = 3000;

  async reverse(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CargoGo/1.0' },
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.display_name || null;
    } catch {
      return null;
    }
  }
}
