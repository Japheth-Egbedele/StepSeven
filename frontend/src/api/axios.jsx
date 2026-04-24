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

// Bearer-token fallback for mobile browsers that block cross-site cookies.
// Cookie auth still works when available; the Authorization header is only added if a token exists.
instance.interceptors.request.use((config) => {
  try {
    const token = window?.localStorage?.getItem('stepseven_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore storage errors (private mode, blocked storage, etc.)
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Avoid hard redirects here (they cause "flash" loops and fight React Router).
    // Route protection is handled by `ProtectedRoute` + auth state.
    const payload = error.response?.data;
    const message =
      payload?.message ||
      error.message ||
      'Network error';
    return Promise.reject({ ...(payload || {}), message });
  }
);

export default instance;