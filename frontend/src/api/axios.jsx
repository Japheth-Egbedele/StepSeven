import axios from 'axios';

const normalizeApiBaseUrl = (raw) => {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const resolvedBaseURL = (() => {
  const envBase = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
  if (envBase) return envBase;

  // In local dev we prefer same-origin + Vite proxy (avoids CORS/cookie surprises).
  if (import.meta.env.DEV) return '/api';

  return 'http://localhost:5000/api';
})();

const instance = axios.create({
  baseURL: resolvedBaseURL,
  withCredentials: true, // this sends the HTTP-only cookie automatically — no Bearer token needed
  headers: {
    'Content-Type': 'application/json'
  }
});

// No request interceptor needed — cookie is attached by the browser automatically

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on auth pages
      const isAuthPage = ['/login', '/register'].includes(window.location.pathname);
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || { message: 'Network error' });
  }
);

export default instance;