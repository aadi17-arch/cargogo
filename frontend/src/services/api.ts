import axios from 'axios';

export const BASE_URL = 'http://192.168.1.9:5000';
export const SOCKET_URL = 'http://192.168.1.9:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
