import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Campaign, CreateCampaignData, CampaignStats } from '@/types';

export function useCampaigns(userId: number) {
  return useQuery({
    queryKey: ['/api/campaigns', userId],
    enabled: !!userId,
  });
}

export function useCampaign(campaignId: number) {
  return useQuery({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId,
  });
}

export function useCampaignStats(campaignId: number) {
  return useQuery({
    queryKey: ['/api/campaigns', campaignId, 'stats'],
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const response = await apiRequest('POST', '/api/campaigns', data);
      return response.json();
    },
    onSuccess: (newCampaign: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', newCampaign.userId] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Campaign> }) => {
      const response = await apiRequest('PATCH', `/api/campaigns/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedCampaign: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', updatedCampaign.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', updatedCampaign.id] });
    },
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest('POST', `/api/campaigns/${campaignId}/start`);
      return response.json();
    },
    onSuccess: (result: { campaign: Campaign }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', result.campaign.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', result.campaign.id] });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await apiRequest('POST', `/api/campaigns/${campaignId}/pause`);
      return response.json();
    },
    onSuccess: (campaign: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaign.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaign.id] });
    },
  });
}
