import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API functions
const fetchBids = async ({ page = 1, limit = 10, portal, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (portal) params.append('portal', portal);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);

  try {
    const response = await fetch(`${API_BASE_URL}/bids?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    // Return empty result structure for network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page),
        pages: 0,
        data: []
      };
    }
    throw error;
  }
};

const fetchTodaysCount = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/bids/today`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    // Return empty result structure for network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        success: true,
        data: { count: 0, date: new Date().toISOString().split('T')[0] }
      };
    }
    throw error;
  }
};

const refreshBids = async () => {
  const response = await fetch(`${API_BASE_URL}/bids/refresh`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to refresh bids');
  }
  return response.json();
};

const deleteBid = async (bidId) => {
  const response = await fetch(`${API_BASE_URL}/bids/${bidId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete bid');
  }
  return response.json();
};

// Custom hooks
export const useBids = (page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
  return useQuery({
    queryKey: ['bids', page, limit, sortBy, sortOrder],
    queryFn: () => fetchBids({ page, limit, sortBy, sortOrder }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes auto-refresh
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useTodaysCount = () => {
  return useQuery({
    queryKey: ['todaysCount'],
    queryFn: fetchTodaysCount,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // 1 minute auto-refresh
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useRefreshBids = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: refreshBids,
    onSuccess: () => {
      // Invalidate and refetch all bid-related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['todaysCount'] });
    },
  });
};

export const useDeleteBid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteBid,
    onSuccess: () => {
      // Invalidate and refetch all bid-related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['todaysCount'] });
    },
  });
};