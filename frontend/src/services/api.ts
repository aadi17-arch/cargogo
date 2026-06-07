import axios from 'axios';
import { API_URL } from '@/utils/constants';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined') config.headers.Authorization = `Bearer ${token}`;
  return config;
},
  (e) => {
    return Promise.reject(e);
  }
);
api.interceptors.response.use(
  (res) => res,
  async (e) => {
    const originalRequest = e.config;

    if (e.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`, {}, { withCredentials: true }
        );
        const { accessToken } = res.data.data;
        localStorage.setItem('token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }
      catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(e);
  }
);

export default api;
