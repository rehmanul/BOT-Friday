import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActiveCampaigns } from '@/components/dashboard/active-campaigns';
import { RealTimeActivity } from '@/components/dashboard/real-time-activity';
import { useCampaigns, useStartCampaign, usePauseCampaign } from '@/hooks/use-campaigns';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/components/ui/toast-system';
import type { DashboardStats } from '@/types';

export default function Dashboard() {
  const userId = 1; // In a real app, this would come from authentication
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats', userId],
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns(userId);

  // Fetch activity logs
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/activity', userId],
  });

  // Campaign mutations
  const startCampaignMutation = useStartCampaign();
  const pauseCampaignMutation = usePauseCampaign();

  // WebSocket connection for real-time updates
  const { onMessage, offMessage } = useWebSocket(userId);

  useEffect(() => {
    const handleCampaignUpdate = (message: any) => {
      switch (message.type) {
        case 'campaign_started':
          toast.success('Campaign Started', 'Your campaign is now running');
          break;
        case 'campaign_paused':
          toast.warning('Campaign Paused', 'Campaign has been paused');
          break;
        case 'invitation_sent':
          toast.info('Invitation Sent', `Sent to @${message.creator?.username}`);
          break;
        case 'session_refreshed':
          toast.success('Session Refreshed', 'TikTok session has been renewed');
          break;
        default:
          break;
      }
    };

    onMessage('campaign_started', handleCampaignUpdate);
    onMessage('campaign_paused', handleCampaignUpdate);
    onMessage('invitation_sent', handleCampaignUpdate);
    onMessage('session_refreshed', handleCampaignUpdate);

    return () => {
      offMessage('campaign_started');
      offMessage('campaign_paused');
      offMessage('invitation_sent');
      offMessage('session_refreshed');
    };
  }, [onMessage, offMessage]);

  const handleStartCampaign = async (campaignId: number) => {
    try {
      await startCampaignMutation.mutateAsync(campaignId);
    } catch (error) {
      toast.error('Failed to start campaign', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handlePauseCampaign = async (campaignId: number) => {
    try {
      await pauseCampaignMutation.mutateAsync(campaignId);
    } catch (error) {
      toast.error('Failed to pause campaign', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const defaultStats: DashboardStats = {
    activeCampaigns: 0,
    creatorsContacted: 0,
    responseRate: 0,
    totalGMV: 0
  };

  return (
    <>
      <Header 
        title="Campaign Dashboard" 
        subtitle="Monitor and manage your TikTok automation campaigns"
        notifications={3}
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-8">
        {/* Stats Overview */}
        <StatsCards 
          stats={stats || defaultStats} 
          isLoading={statsLoading} 
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Campaigns */}
          <ActiveCampaigns
            campaigns={campaigns}
            isLoading={campaignsLoading}
            onStartCampaign={handleStartCampaign}
            onPauseCampaign={handlePauseCampaign}
          />

          {/* Real-time Activity */}
          <RealTimeActivity
            userId={userId}
            activities={activities}
          />
        </div>
      </main>
    </>
  );
}
