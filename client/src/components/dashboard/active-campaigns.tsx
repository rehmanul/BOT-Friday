import { Play, Pause, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Campaign } from '@/types';

interface ActiveCampaignsProps {
  campaigns: Campaign[];
  isLoading?: boolean;
  onStartCampaign?: (id: number) => void;
  onPauseCampaign?: (id: number) => void;
}

export function ActiveCampaigns({ 
  campaigns, 
  isLoading, 
  onStartCampaign, 
  onPauseCampaign 
}: ActiveCampaignsProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProgressPercentage = (campaign: Campaign) => {
    return campaign.targetInvitations > 0 
      ? Math.round((campaign.sentCount / campaign.targetInvitations) * 100)
      : 0;
  };

  if (isLoading) {
    return (
      <Card className="bg-card-bg border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-32" />
                    <div className="h-3 bg-slate-700 rounded w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-16" />
                  <div className="h-2 bg-slate-700 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-bg border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Active Campaigns</CardTitle>
          <Button className="bg-primary hover:bg-primary/80">
            <Play className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No active campaigns</p>
            <p className="text-sm text-gray-500 mt-1">Create your first campaign to get started</p>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const progress = getProgressPercentage(campaign);
            
            return (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600 hover:bg-slate-800/70 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{campaign.name}</h4>
                    <p className="text-sm text-gray-400">
                      Target: {campaign.targetInvitations} creators • {campaign.sentCount || 0} sent
                    </p>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        {campaign.status === 'active' ? (
                          <DropdownMenuItem 
                            className="text-yellow-400 hover:bg-slate-700"
                            onClick={() => onPauseCampaign?.(campaign.id)}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Campaign
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-green-400 hover:bg-slate-700"
                            onClick={() => onStartCampaign?.(campaign.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="hover:bg-slate-700">
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-slate-700">
                          Edit Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">{progress}%</span>
                    <Progress value={progress} className="w-20 h-2" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
