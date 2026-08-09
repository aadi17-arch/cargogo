import { GeocodingProvider } from './provider';

export class PhotonProvider extends GeocodingProvider {
  name = 'Photon';
  timeoutMs = 2500;

  async reverse(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const feat = data.features?.[0]?.properties;
      if (!feat) return null;
      return [feat.name, feat.city, feat.state, feat.country].filter(Boolean).join(', ');
    } catch {
      return null;
    }
  }
}
