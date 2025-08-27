const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  console.log(`API Request: ${config.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('API Error:', errorData);
      
      // Create an error that matches the expected format
      const error = new Error(errorData.error || errorData.message || 'Request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    return response.json();
  } catch (error) {
    // Handle network errors gracefully
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('Network Error: Unable to connect to server');
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

// Bid API endpoints
export const getBids = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const endpoint = `/bids${queryParams ? `?${queryParams}` : ''}`;
  return apiRequest(endpoint);
};

export const getTodaysBidCount = () => {
  return apiRequest('/bids/today');
};

export const refreshBids = () => {
  return apiRequest('/bids/refresh', { method: 'POST' });
};

export const getBidById = (id) => {
  return apiRequest(`/bids/${id}`);
};

// Credential API endpoints
export const getCredentials = () => {
  return apiRequest('/credentials');
};

export const createCredential = (credentialData) => {
  return apiRequest('/credentials', {
    method: 'POST',
    body: JSON.stringify(credentialData),
  });
};

export const updateCredential = (id, credentialData) => {
  return apiRequest(`/credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credentialData),
  });
};

export const deleteCredential = (id) => {
  return apiRequest(`/credentials/${id}`, {
    method: 'DELETE',
  });
};

// Scraper API endpoints
export const runScraper = () => {
  return apiRequest('/scraper/run', { method: 'POST' });
};

export const getScraperStatus = () => {
  return apiRequest('/scraper/status');
};

export const startScheduler = () => {
  return apiRequest('/scraper/scheduler/start', { method: 'POST' });
};

export const stopScheduler = () => {
  return apiRequest('/scraper/scheduler/stop', { method: 'POST' });
};

// Test SEPTA scraper endpoint
export const testSeptaScraper = () => {
  return apiRequest('/test-septa-scraper');
};

// Health check
export const healthCheck = () => {
  return apiRequest('/health');
};

const apiHelpers = { 
  getBids, 
  getTodaysBidCount, 
  refreshBids, 
  getBidById, 
  getCredentials, 
  createCredential, 
  updateCredential, 
  deleteCredential, 
  runScraper, 
  getScraperStatus, 
  startScheduler, 
  stopScheduler, 
  testSeptaScraper,
  healthCheck 
};

export default apiHelpers;