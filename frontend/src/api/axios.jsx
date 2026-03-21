import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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