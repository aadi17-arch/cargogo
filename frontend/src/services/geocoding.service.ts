import api from "./api";

// In-memory cache for search & reverse geocoding
const cache = new Map<string, any>();

export const geocodingService = {
  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    if (cache.has(`search:${q}`)) {
      return cache.get(`search:${q}`);
    }

    // Provider 1: Photon (Free, No Rate Limits)
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        if (json.features && json.features.length > 0) {
          const formatted = json.features.map((f: any) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const parts = [props.name, props.street, props.locality, props.city, props.state, props.country].filter(Boolean);
            return { display_name: parts.join(', '), lat: String(coords[1]), lon: String(coords[0]) };
          });
          cache.set(`search:${q}`, formatted);
          return formatted;
        }
      }
    } catch (e) {
      console.warn('Photon search failed, trying backend fallback...', e);
    }

    // Provider 2: Backend Multi-API Router
    try {
      const res = await api.get(`/geocoding/search?q=${encodeURIComponent(query)}`, {
        skipGlobalToast: true,
        timeout: 5000
      });
      if (res.data?.data) {
        cache.set(`search:${q}`, res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend search fallback failed:', e);
    }

    return [];
  },

  async reverse(lat: number, lng: number) {
    const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Provider 1: BigDataCloud (Free Client API)
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (res.ok) {
        const data = await res.json();
        const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
        if (parts.length > 0) {
          const result = { display_name: parts.join(', '), lat: String(lat), lon: String(lng) };
          cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('BigDataCloud reverse geocoding failed, trying Nominatim...', e);
    }

    // Provider 2: OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'CargoGo/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const result = { display_name: data.display_name, lat: String(lat), lon: String(lng) };
          cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      console.warn('Nominatim reverse failed, trying backend fallback...', e);
    }

    // Provider 3: Backend Router Fallback
    try {
      const res = await api.get(`/geocoding/reverse?lat=${lat}&lon=${lng}`, {
        skipGlobalToast: true,
        timeout: 5000
      });
      if (res.data?.data) {
        cache.set(cacheKey, res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend reverse failed:', e);
    }

    // Guaranteed Offline Coordinate String (100% Reliable, Zero Failure)
    const fallback = { display_name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat: String(lat), lon: String(lng) };
    cache.set(cacheKey, fallback);
    return fallback;
  }
};
