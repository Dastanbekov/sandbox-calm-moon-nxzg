import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = API_BASE.replace(/\/api\/?$/, '');

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Crucial for sending httpOnly cookies
});

// Request interceptor to inject Access Token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration (401)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet, and it's not the login or refresh endpoint
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request new access token using httpOnly refresh cookie or local storage fallback
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        const payload = refreshToken ? { refresh: refreshToken } : {};
        
        const response = await axios.post(
          `${API_URL}/api/auth/refresh/`,
          payload,
          { withCredentials: true }
        );

        const newAccessToken = response.data.access;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', newAccessToken);
          
          // For mobile compatibility fallback, if refresh token returned in body
          if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
          }
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear storage and redirect to login if refresh fails (session expired or bad request)
        if (typeof window !== 'undefined' && (refreshError.response?.status === 401 || refreshError.response?.status === 400)) {
          // Refresh token expired, invalid, or missing, log out user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-error'));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  async register(data: any) {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.post('/api/auth/verify-email/', { token });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials: any) {
    const response = await api.post('/api/auth/login/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);  // Mobile compatibility fallback
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await api.post('/api/auth/logout/', { refresh: refreshToken });
    } catch (e) {
      // Ignore error if server logout fails (token already expired/blacklisted)
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  async getMe() {
    const response = await api.get('/api/auth/me/');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  isAuthenticated() {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }
};
