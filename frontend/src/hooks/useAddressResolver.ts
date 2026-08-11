import { useState, useCallback } from 'react';
import { geocodingService } from '@/services/geocoding.service';

export function useAddressResolver() {
  const [addressCache, setAddressCache] = useState<{ [key: string]: string }>({});

  const resolveSingleAddress = useCallback(async (lat: number, lng: number): Promise<string> => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (addressCache[key]) {
      return addressCache[key];
    }
    try {
      const data = await geocodingService.reverse(lat, lng);
      const name = data?.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddressCache((prev) => ({ ...prev, [key]: name }));
      return name;
    } catch (e) {
      console.error('Reverse geocode failed:', e);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, [addressCache]);

  const resolveAddresses = useCallback(async (stops: any[]) => {
    const newAddresses = { ...addressCache };
    let updated = false;

    for (const stop of stops) {
      const lat = stop?.location?.lat;
      const lng = stop?.location?.lng;
      if (lat === undefined || lng === undefined) continue;

      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (!newAddresses[key]) {
        try {
          const data = await geocodingService.reverse(lat, lng);
          if (data?.display_name) {
            newAddresses[key] = data.display_name.split(',')[0] || 'Unknown Location';
            updated = true;
          }
        } catch (e) {
          console.error('Batch reverse geocode failed:', e);
        }
      }
    }

    if (updated) {
      setAddressCache(newAddresses);
    }
  }, [addressCache]);

  return {
    addressCache,
    resolveAddresses,
    resolveSingleAddress,
  };
}
