import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Creator, CreatorFilters } from '@/types';

export function useCreators(filters?: CreatorFilters, limit = 25, offset = 0) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.minFollowers) queryParams.append('minFollowers', filters.minFollowers.toString());
  if (filters?.maxFollowers) queryParams.append('maxFollowers', filters.maxFollowers.toString());
  if (filters?.minGMV) queryParams.append('minGMV', filters.minGMV.toString());
  if (filters?.maxGMV) queryParams.append('maxGMV', filters.maxGMV.toString());
  if (filters?.engagementRate) queryParams.append('engagementRate', filters.engagementRate);
  queryParams.append('limit', limit.toString());
  queryParams.append('offset', offset.toString());

  return useQuery({
    queryKey: ['/api/creators', filters, limit, offset],
    queryFn: async () => {
      const response = await fetch(`/api/creators?${queryParams.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }
      // Now returns { creators, total }
      return response.json();
    },
  });
}

export function useSearchCreators(query: string) {
  return useQuery({
    queryKey: ['/api/creators/search', query],
    enabled: !!query && query.length > 2,
    queryFn: async () => {
      const response = await fetch(`/api/creators/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to search creators');
      }
      return response.json();
    },
  });
}

export function useDiscoverCreators() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (criteria: any) => {
      const response = await apiRequest('POST', '/api/creators/discover', criteria);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creators'] });
    },
  });
}

export function useCreateCreator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Creator, 'id' | 'createdAt' | 'lastUpdated'>) => {
      const response = await apiRequest('POST', '/api/creators', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creators'] });
    },
  });
}
