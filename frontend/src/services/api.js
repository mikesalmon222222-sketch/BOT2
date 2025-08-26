import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Bid API endpoints
export const getBids = (params = {}) => {
  return api.get('/bids', { params });
};

export const getTodaysBidCount = () => {
  return api.get('/bids/today');
};

export const refreshBids = () => {
  return api.post('/bids/refresh');
};

export const getBidById = (id) => {
  return api.get(`/bids/${id}`);
};

// Credential API endpoints
export const getCredentials = () => {
  return api.get('/credentials');
};

export const createCredential = (credentialData) => {
  return api.post('/credentials', credentialData);
};

export const updateCredential = (id, credentialData) => {
  return api.put(`/credentials/${id}`, credentialData);
};

export const deleteCredential = (id) => {
  return api.delete(`/credentials/${id}`);
};

// Scraper API endpoints
export const runScraper = () => {
  return api.post('/scraper/run');
};

export const getScraperStatus = () => {
  return api.get('/scraper/status');
};

export const startScheduler = () => {
  return api.post('/scraper/scheduler/start');
};

export const stopScheduler = () => {
  return api.post('/scraper/scheduler/stop');
};

// Health check
export const healthCheck = () => {
  return api.get('/health');
};

export default api;