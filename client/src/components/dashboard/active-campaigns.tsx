import { useState } from 'react';
import { Play, Pause, MoreVertical, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/types';

interface ActiveCampaignsProps {
  campaigns: Campaign[];
  isLoading?: boolean;
  onStartCampaign?: (campaignId: number) => void;
  onPauseCampaign?: (campaignId: number) => void;
}

export function ActiveCampaigns({ 
  campaigns, 
  isLoading, 
  onStartCampaign, 
  onPauseCampaign 
}: ActiveCampaignsProps) {
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleCampaignAction = async (campaignId: number, action: 'start' | 'pause') => {
    setActionLoading(campaignId);
    try {
      if (action === 'start' && onStartCampaign) {
        await onStartCampaign(campaignId);
      } else if (action === 'pause' && onPauseCampaign) {
        await onPauseCampaign(campaignId);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'draft':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card-bg border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-slate-700 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'paused');

  return (
    <Card className="bg-card-bg border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          Active Campaigns
          <span className="text-sm text-gray-400 font-normal">
            {activeCampaigns.length} active
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active campaigns</p>
            <p className="text-sm">Create a campaign to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{campaign.sentCount || 0}/{campaign.targetInvitations}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{((campaign.responseCount || 0) / Math.max(campaign.sentCount || 1, 1) * 100).toFixed(1)}% response</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        disabled={actionLoading === campaign.id}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleCampaignAction(campaign.id, 'start')}
                        disabled={actionLoading === campaign.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((campaign.sentCount || 0) / campaign.targetInvitations * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}