import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL 

const api = axios.create({
  baseURL: API_BASE_URL|| process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${config.method?.toUpperCase()} ${config.url}`, config.data);
      }

      if (process.env.NODE_ENV === 'production' && !api.baseURL.startsWith('https://')) {
        console.warn('⚠️ Forcing HTTPS for production environment');
        api.baseURL = api.baseURL.replace('http://', 'https://');
      }
      
      
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );
  
  // Response interceptor to handle errors
  api.interceptors.response.use(
    (response) => {
      // Log responses in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Response from ${response.config.url}:`, response.data);
      }
      return response;
    },
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );
  
  export default api;