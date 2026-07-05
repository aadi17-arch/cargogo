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
    const res = await api.get(`/geocoding/reverse?lat=${lat}&lon=${lng}`, {
      skipGlobalToast: true,
      timeout: 5000
    });
    return res.data.data;
  }
};
