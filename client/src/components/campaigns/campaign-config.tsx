import { useState } from 'react';
import { Plus, Save, Brain, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateCampaign } from '@/hooks/use-campaigns';
import { toast } from '@/components/ui/toast-system';
import type { CreateCampaignData } from '@/types';

interface CampaignConfigProps {
  userId: number;
  onSuccess?: () => void;
}

export function CampaignConfig({ userId, onSuccess }: CampaignConfigProps) {
  const [config, setConfig] = useState<Partial<CreateCampaignData>>({
    userId,
    name: '',
    targetInvitations: 100,
    dailyLimit: 20,
    invitationTemplate: `Hi {creator_name}! 👋

I'm reaching out because I love your {category} content! We'd love to collaborate with you on our upcoming campaign.

Would you be interested in learning more about our partnership opportunities?

Looking forward to hearing from you!
Best regards,
{sender_name}`,
    humanLikeDelays: true,
    aiOptimization: true,
    filters: {
      categories: [],
      minFollowers: 10000,
      minGMV: 5000
    }
  });

  const createCampaignMutation = useCreateCampaign();

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const currentCategories = config.filters?.categories || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);
    
    handleFilterChange('categories', newCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.name?.trim()) {
      toast.error('Validation Error', 'Campaign name is required');
      return;
    }

    if (!config.targetInvitations || config.targetInvitations <= 0) {
      toast.error('Validation Error', 'Target invitations must be greater than 0');
      return;
    }

    try {
      await createCampaignMutation.mutateAsync(config as CreateCampaignData);
      onSuccess?.();
    } catch (error) {
      toast.error('Campaign Creation Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const categories = [
    'Fashion & Beauty',
    'Gaming',
    'Lifestyle',
    'Tech & Reviews',
    'Food & Cooking',
    'Fitness'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaignName" className="text-gray-300">Campaign Name</Label>
          <Input
            id="campaignName"
            value={config.name || ''}
            onChange={(e) => handleConfigChange('name', e.target.value)}
            placeholder="Enter campaign name"
            className="bg-slate-800 border-slate-600 text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetInvitations" className="text-gray-300">Target Invitations</Label>
            <Input
              id="targetInvitations"
              type="number"
              value={config.targetInvitations || ''}
              onChange={(e) => handleConfigChange('targetInvitations', parseInt(e.target.value))}
              placeholder="100"
              min="1"
              className="bg-slate-800 border-slate-600 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyLimit" className="text-gray-300">Daily Limit</Label>
            <Select 
              value={config.dailyLimit?.toString() || '20'}
              onValueChange={(value) => handleConfigChange('dailyLimit', parseInt(value))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="10">10 per day</SelectItem>
                <SelectItem value="20">20 per day</SelectItem>
                <SelectItem value="30">30 per day</SelectItem>
                <SelectItem value="50">50 per day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Creator Filters */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardContent className="p-4 space-y-4">
          <h4 className="font-medium text-white">Creator Filters</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minFollowers" className="text-gray-300">Minimum Followers</Label>
              <Input
                id="minFollowers"
                type="number"
                value={config.filters?.minFollowers || ''}
                onChange={(e) => handleFilterChange('minFollowers', parseInt(e.target.value))}
                placeholder="10000"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minGMV" className="text-gray-300">Minimum GMV ($)</Label>
              <Input
                id="minGMV"
                type="number"
                value={config.filters?.minGMV || ''}
                onChange={(e) => handleFilterChange('minGMV', parseInt(e.target.value))}
                placeholder="5000"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-300">Target Categories</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const isSelected = config.filters?.categories?.includes(category) || false;
                return (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleCategoryToggle(category, !!checked)}
                      className="border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={category} className="text-sm text-gray-300 cursor-pointer">
                      {category}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitation Template */}
      <div className="space-y-2">
        <Label htmlFor="template" className="text-gray-300">Invitation Template</Label>
        <Textarea
          id="template"
          rows={6}
          value={config.invitationTemplate || ''}
          onChange={(e) => handleConfigChange('invitationTemplate', e.target.value)}
          className="bg-slate-800 border-slate-600 text-white"
          placeholder="Enter your invitation message template..."
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            Available variables: {'{creator_name}'}, {'{category}'}, {'{sender_name}'}, {'{follower_count}'}
          </Badge>
        </div>
      </div>

      {/* Automation Settings */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardContent className="p-4 space-y-4">
          <h4 className="font-medium text-white">Automation Settings</h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-white">Human-like Delays</p>
                <p className="text-xs text-gray-400">Add random delays (2-10 min) between invitations</p>
              </div>
            </div>
            <Switch 
              checked={config.humanLikeDelays || false}
              onCheckedChange={(checked) => handleConfigChange('humanLikeDelays', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-white">Gemini AI Optimization</p>
                <p className="text-xs text-gray-400">AI-powered creator targeting and content optimization</p>
              </div>
            </div>
            <Switch 
              checked={config.aiOptimization || false}
              onCheckedChange={(checked) => handleConfigChange('aiOptimization', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="outline"
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
        >
          Save Draft
        </Button>
        <Button 
          type="submit"
          disabled={createCampaignMutation.isPending}
          className="bg-primary hover:bg-primary/80"
        >
          {createCampaignMutation.isPending ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
