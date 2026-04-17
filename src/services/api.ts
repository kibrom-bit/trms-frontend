import axios from 'axios';

// Ensure you set VITE_API_BASE_URL in your .env if the backend is on a different host.
// If using Vite proxy, it can just be '/api/v1'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor keeps existing headers untouched.
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the token is invalid or expired
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url?.includes('/auth/login');
      if (!isAuthEndpoint) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
