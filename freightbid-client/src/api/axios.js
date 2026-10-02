import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('freightbid_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 (auth failure) and 403 (blocked/pending)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response) {
      const message = response.data?.message || 'An error occurred';

      if (response.status === 401) {
        // Token expired or invalid: clear storage and redirect
        localStorage.removeItem('freightbid_token');
        localStorage.removeItem('freightbid_user');

        // Avoid repeated toasts on initial login checks or background polls
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
      } else if (response.status === 403) {
        // Blocked, rejected, or unverified
        toast.error(message);
        if (response.data?.status === 'BLOCKED' || response.data?.status === 'PENDING' || response.data?.status === 'REJECTED') {
          localStorage.removeItem('freightbid_token');
          localStorage.removeItem('freightbid_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    } else {
      toast.error('Cannot connect to server. Please check your internet or server connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
