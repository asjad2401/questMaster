import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Tracking authentication state to prevent multiple redirects
let isRedirecting = false;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to check if token is expired (if JWT has exp claim)
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    
    // Check if token is expired (with a 10-second buffer)
    return exp ? Date.now() >= (exp * 1000) - 10000 : false;
  } catch (e) {
    return false;
  }
};

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        // Redirect to login if not already redirecting
        if (!isRedirecting) {
          isRedirecting = true;
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired'));
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized or forbidden access
      if (!isRedirecting) {
        isRedirecting = true;
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        // Give a small delay before redirecting to ensure state is cleared
        setTimeout(() => {
          window.location.href = '/login';
          isRedirecting = false;
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 