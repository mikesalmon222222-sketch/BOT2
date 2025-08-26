import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const bidService = {
  getAllBids: () => api.get('/bids'),
  getTodaysCount: () => api.get('/bids/today'),
  refreshBids: () => api.post('/bids/refresh'),
  
  getAllCredentials: () => api.get('/credentials'),
  addCredential: (data) => api.post('/credentials', data),
  updateCredential: (id, data) => api.put(`/credentials/${id}`, data),
  deleteCredential: (id) => api.delete(`/credentials/${id}`),
  
  runScraper: () => api.post('/scraper/run'),
  getScraperStatus: () => api.get('/scraper/status'),
  
  healthCheck: () => api.get('/health')
};

export default api;