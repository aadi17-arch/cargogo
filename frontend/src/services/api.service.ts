import axios from 'axios';
import { API_URL } from '@/utils/constants';
import toast from 'react-hot-toast';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalToast?: boolean;
  }
}

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

    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

    if (e.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
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
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Extract error message
    const errMsg = e.response?.data?.message || e.message || 'Something went wrong';

    // Show toast error globally if not explicitly skipped, and not a 401 unauthorized error
    if (!originalRequest?.skipGlobalToast && e.response?.status !== 401) {
      toast.dismiss();
      toast.error(errMsg);
    }

    return Promise.reject(e);
  }
);

export default api;
