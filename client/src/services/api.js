import axios from 'axios';

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.get(`${API_BASE}/api/auth/refresh`, { withCredentials: true });
        const token = data.data?.accessToken;
        if (!token) {
          setAccessToken(null);
          return Promise.reject(error);
        }
        setAccessToken(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (err) {
        setAccessToken(null);
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
