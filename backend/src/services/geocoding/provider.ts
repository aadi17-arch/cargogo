export abstract class GeocodingProvider {
  abstract name: string;
  abstract timeoutMs: number;

  abstract reverse(lat: number, lng: number): Promise<string | null>;
}
