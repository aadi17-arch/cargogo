import api from "./api";

export const geocodingService = {
  async search(query: string) {
    const res = await api.get(`/geocoding/search?q=${encodeURIComponent(query)}`, {
      skipGlobalToast: true,
      timeout: 5000
    });
    return res.data.data;
  },
  async reverse(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'CargoGo/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          return { display_name: data.display_name, lat: String(lat), lon: String(lng) };
        }
      }
    } catch (e) {
      console.warn('Direct Nominatim reverse geocoding failed, using backend:', e);
    }
    const res = await api.get(`/geocoding/reverse?lat=${lat}&lon=${lng}`, {
      skipGlobalToast: true,
      timeout: 5000
    });
    return res.data.data;
  }
};
