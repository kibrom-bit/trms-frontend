import axios from 'axios';

// Ensure VITE_API_BASE_URL points to backend root or versioned API path.
// This normalizes values like https://host to https://host/api/v1.
const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');
const API_BASE_URL = rawApiBaseUrl.endsWith('/api/v1') ? rawApiBaseUrl : `${rawApiBaseUrl}/api/v1`;

const SESSION_TOKEN_KEY = 'trms_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach session token on refresh-safe loads.
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore storage errors
    }
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
      const url = String(error.config?.url || '');
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/oidc');
      const alreadyOnLogin = window.location.pathname.startsWith('/login');

      // Avoid redirect loops on first paint/refresh and ignore auth endpoints.
      if (!isAuthEndpoint && !alreadyOnLogin) {
        try {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
        } catch {
          // ignore
        }
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);
