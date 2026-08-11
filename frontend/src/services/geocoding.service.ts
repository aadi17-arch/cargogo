import api from "./api.service";

export const geocodingService = {
  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    try {
      const res = await api.get(`/geocoding/search?q=${encodeURIComponent(query)}`, {
        skipGlobalToast: true,
        timeout: 4000
      });
      return res.data?.data || {};
    } catch (e) {
      console.warn('Backend search query failed:', e);
      return [];
    }
  },

  async reverse(lat: number, lng: number) {
    try {
      const res = await api.get(`/geocoding/reverse?lat=${lat}&lng=${lng}`, {
        skipGlobalToast: true,
        timeout: 5000
      });
      return res.data?.data || {
        display_name: `Location (${lat.toFixed(4)},${lat.toFixed(4)})`, lat: String(lat), lng: String(lng)
      };

    } catch (e) {
      console.warn('Backend reverse lookup failed:', e);
      return {
        display_name: `Location(${lat.toFixed(4)},${lat.toFixed(4)})`, lat: String(lat), lng: String(lng)
      };
    }
  }
};
