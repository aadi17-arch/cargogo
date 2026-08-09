import { GeocodingProvider } from './provider';
import { MapboxProvider } from './mapbox.provider';
import { OpenCageProvider } from './opencage.provider';
import { PhotonProvider } from './photon.provider';
import { NominatimProvider } from './nominatim.provider';
import { GeminiProvider } from './gemini.provider';
import { LocalDbProvider } from './local.provider';
import prisma from '../../config/database';

const providers: GeocodingProvider[] = [
  new LocalDbProvider(), // Always check cache first locally
  new MapboxProvider(),
  new OpenCageProvider(),
  new PhotonProvider(),
  new NominatimProvider(),
  new GeminiProvider()
];

export async function resolveAddressChain(lat: number, lng: number): Promise<string> {
  const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;

  for (const provider of providers) {
    try {
      const address = await provider.reverse(lat, lng);
      if (address) {
        console.log(`Resolved via: ${provider.name}`);
        
        // Write-through caching to Database if resolved from a remote API
        if (provider.name !== 'LocalDB') {
          await prisma.geocodeCache.create({
            data: {
              query: cacheKey,
              displayName: address,
              latitude: lat,
              longitude: lng
            }
          }).catch(() => {});
        }
        
        return address;
      }
    } catch (err) {
      console.warn(`Provider ${provider.name} failed:`, err);
    }
  }

  // Fallback if all else fails
  return `Location(${lat.toFixed(4)},${lng.toFixed(4)})`;
}
