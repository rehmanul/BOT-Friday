import { useState } from 'react';
import { Plus, Play, Pause, MoreVertical, BarChart } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CampaignConfig } from '@/components/campaigns/campaign-config';
import { useCampaigns, useStartCampaign, usePauseCampaign } from '@/hooks/use-campaigns';
import { toast } from '@/components/ui/toast-system';
import type { Campaign } from '@/types';

export default function Campaigns() {
  const userId = 1; // In a real app, this would come from authentication
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: campaigns = [], isLoading } = useCampaigns(userId);
  const startCampaignMutation = useStartCampaign();
  const pauseCampaignMutation = usePauseCampaign();

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

  const handleStartCampaign = async (campaignId: number) => {
    try {
      await startCampaignMutation.mutateAsync(campaignId);
      toast.success('Campaign Started', 'Your campaign is now running');
    } catch (error) {
      toast.error('Failed to start campaign', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handlePauseCampaign = async (campaignId: number) => {
    try {
      await pauseCampaignMutation.mutateAsync(campaignId);
      toast.success('Campaign Paused', 'Campaign has been paused');
    } catch (error) {
      toast.error('Failed to pause campaign', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleCampaignCreated = () => {
    setIsCreateDialogOpen(false);
    toast.success('Campaign Created', 'Your new campaign has been created successfully');
  };

  if (isLoading) {
    return (
      <>
        <Header title="Campaign Management" subtitle="Create and manage your automation campaigns" />
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card-bg border-slate-700">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-8 bg-slate-700 rounded w-1/2" />
                    <div className="h-3 bg-slate-700 rounded w-full" />
                    <div className="h-2 bg-slate-700 rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Campaign Management" subtitle="Create and manage your automation campaigns" />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white">All Campaigns</h2>
            <p className="text-gray-400 mt-1">{campaigns.length} total campaigns</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card-bg border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Campaign</DialogTitle>
              </DialogHeader>
              <CampaignConfig 
                userId={userId}
                onSuccess={handleCampaignCreated}
              />
            </DialogContent>
          </Dialog>
        </div>

        {campaigns.length === 0 ? (
          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
              <p className="text-gray-400 mb-6">Create your first campaign to start reaching out to TikTok creators</p>
              <Button 
                className="bg-primary hover:bg-primary/80"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = getProgressPercentage(campaign);
              
              return (
                <Card key={campaign.id} className="bg-card-bg border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">{campaign.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {campaign.sentCount || 0}/{campaign.targetInvitations}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="hover:bg-slate-700">
                            <BarChart className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-slate-700">
                            Edit Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:bg-slate-700">
                            Delete Campaign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Responses</p>
                        <p className="text-white font-medium">{campaign.responseCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Daily Limit</p>
                        <p className="text-white font-medium">{campaign.dailyLimit}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {campaign.status === 'active' ? (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          onClick={() => handlePauseCampaign(campaign.id)}
                          disabled={pauseCampaignMutation.isPending}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      ) : campaign.status === 'draft' || campaign.status === 'paused' ? (
                        <Button 
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStartCampaign(campaign.id)}
                          disabled={startCampaignMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <BarChart className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
