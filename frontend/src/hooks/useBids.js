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

  const response = await fetch(`${API_BASE_URL}/bids?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bids');
  }
  return response.json();
};

const fetchTodaysCount = async () => {
  const response = await fetch(`${API_BASE_URL}/bids/today`);
  if (!response.ok) {
    throw new Error('Failed to fetch today\'s count');
  }
  return response.json();
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
    retry: false, // Don't retry failed requests in demo
    // Fallback to sample data when API fails
    placeholderData: {
      success: true,
      count: 3,
      total: 3,
      page: 1,
      pages: 1,
      data: [
        {
          id: 'demo_1',
          postedDate: '2025-08-25T10:00:00.000Z',
          dueDate: '2025-09-15T17:00:00.000Z',
          title: 'Metro Transit Bus Fleet Maintenance Services',
          quantity: '150 buses',
          description: 'Comprehensive maintenance services for Metro Transit bus fleet including scheduled inspections, repairs, and emergency services.',
          documents: ['https://example.com/rfp-doc1.pdf', 'https://example.com/specifications.pdf'],
          bidLink: 'https://business.metro.net/solicitation/12345',
          portal: 'metro'
        },
        {
          id: 'demo_2', 
          postedDate: '2025-08-26T14:30:00.000Z',
          dueDate: '2025-09-20T16:00:00.000Z',
          title: 'Construction Materials Supply Contract',
          quantity: '500 tons',
          description: 'Supply of construction materials including concrete, steel, and aggregates for infrastructure projects.',
          documents: ['https://example.com/materials-spec.pdf'],
          bidLink: 'https://business.metro.net/solicitation/12346',
          portal: 'metro'
        },
        {
          id: 'demo_3',
          postedDate: '2025-08-27T09:15:00.000Z', 
          dueDate: '2025-09-10T12:00:00.000Z',
          title: 'IT Security Services and Support',
          quantity: '3 years',
          description: 'Comprehensive IT security services including monitoring, incident response, and compliance support.',
          documents: [],
          bidLink: 'https://business.metro.net/solicitation/12347',
          portal: 'metro'
        }
      ]
    }
  });
};

export const useTodaysCount = () => {
  return useQuery({
    queryKey: ['todaysCount'],
    queryFn: fetchTodaysCount,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // 1 minute auto-refresh
    retry: false, // Don't retry failed requests in demo
    // Fallback to sample data when API fails
    placeholderData: {
      success: true,
      data: { count: 3, date: new Date().toISOString().split('T')[0] }
    }
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