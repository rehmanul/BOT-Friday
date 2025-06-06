import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Download, BarChart, PieChart, Activity } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCampaigns } from '@/hooks/use-campaigns';
import { toast } from '@/components/ui/toast-system';
import type { Campaign } from '@/types';

export default function Analytics() {
  const userId = 1; // In a real app, this would come from authentication
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  const { data: campaigns = [] } = useCampaigns(userId);

  // Mock analytics data - in a real app, this would come from an API
  const analyticsData = {
    overview: {
      totalInvitations: 2847,
      totalResponses: 1344,
      totalConversions: 892,
      totalGMV: 127394,
      responseRate: 47.2,
      conversionRate: 66.4,
      avgGMVPerCreator: 142.8,
      growthTrends: {
        invitations: 15.3,
        responses: 23.1,
        conversions: 18.7,
        gmv: 32.4
      }
    },
    campaignPerformance: campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      invitations: Math.floor(Math.random() * 200) + 50,
      responses: Math.floor(Math.random() * 100) + 20,
      conversions: Math.floor(Math.random() * 50) + 10,
      gmv: Math.floor(Math.random() * 50000) + 10000,
      responseRate: Math.random() * 40 + 30,
      roi: Math.random() * 300 + 150
    })),
    topCategories: [
      { category: 'Fashion & Beauty', count: 456, percentage: 35.2 },
      { category: 'Gaming', count: 234, percentage: 18.1 },
      { category: 'Lifestyle', count: 189, percentage: 14.6 },
      { category: 'Tech & Reviews', count: 156, percentage: 12.1 },
      { category: 'Food & Cooking', count: 123, percentage: 9.5 },
      { category: 'Others', count: 136, percentage: 10.5 }
    ]
  };

  const handleExportReport = () => {
    toast.info('Export Started', 'Your analytics report is being prepared for download');
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (trend: number) => {
    return trend > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <>
      <Header 
        title="Analytics & Reporting" 
        subtitle="Performance insights and ROI tracking for your campaigns" 
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="w-64 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExportReport} className="bg-secondary hover:bg-secondary/80">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Invitations</p>
                  <p className="text-2xl font-bold text-blue-400">{analyticsData.overview.totalInvitations.toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-sm">
                    {getTrendIcon(analyticsData.overview.growthTrends.invitations)}
                    <span className={getTrendColor(analyticsData.overview.growthTrends.invitations)}>
                      +{analyticsData.overview.growthTrends.invitations}%
                    </span>
                    <span className="text-gray-400 ml-1">vs last period</span>
                  </div>
                </div>
                <BarChart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Response Rate</p>
                  <p className="text-2xl font-bold text-green-400">{analyticsData.overview.responseRate}%</p>
                  <div className="flex items-center mt-2 text-sm">
                    {getTrendIcon(analyticsData.overview.growthTrends.responses)}
                    <span className={getTrendColor(analyticsData.overview.growthTrends.responses)}>
                      +{analyticsData.overview.growthTrends.responses}%
                    </span>
                    <span className="text-gray-400 ml-1">vs last period</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Conversions</p>
                  <p className="text-2xl font-bold text-purple-400">{analyticsData.overview.totalConversions}</p>
                  <div className="flex items-center mt-2 text-sm">
                    {getTrendIcon(analyticsData.overview.growthTrends.conversions)}
                    <span className={getTrendColor(analyticsData.overview.growthTrends.conversions)}>
                      +{analyticsData.overview.growthTrends.conversions}%
                    </span>
                    <span className="text-gray-400 ml-1">vs last period</span>
                  </div>
                </div>
                <PieChart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total GMV</p>
                  <p className="text-2xl font-bold text-yellow-400">${analyticsData.overview.totalGMV.toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-sm">
                    {getTrendIcon(analyticsData.overview.growthTrends.gmv)}
                    <span className={getTrendColor(analyticsData.overview.growthTrends.gmv)}>
                      +{analyticsData.overview.growthTrends.gmv}%
                    </span>
                    <span className="text-gray-400 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Performance */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.campaignPerformance.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{campaign.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{campaign.invitations} invitations</span>
                        <span>{campaign.responses} responses</span>
                        <span>{campaign.conversions} conversions</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Response Rate</span>
                          <span className="text-white">{campaign.responseRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={campaign.responseRate} className="h-2" />
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-400">GMV</p>
                      <p className="text-lg font-semibold text-green-400">${campaign.gmv.toLocaleString()}</p>
                      <Badge className="bg-blue-500/20 text-blue-400 mt-1">
                        {campaign.roi.toFixed(0)}% ROI
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCategories.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{category.category}</span>
                      <div className="text-right">
                        <span className="text-white">{category.count}</span>
                        <span className="text-gray-400 text-sm ml-2">({category.percentage}%)</span>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="bg-card-bg border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Performance Trends</CardTitle>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-gray-400">Invitations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-gray-400">Responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-gray-400">Conversions</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-600">
              <div className="text-center">
                <BarChart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Performance Chart</p>
                <p className="text-sm text-gray-500">Chart visualization would be integrated here</p>
                <p className="text-xs text-gray-600 mt-1">Using libraries like Chart.js, Recharts, or D3.js</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {analyticsData.overview.conversionRate}%
              </div>
              <p className="text-gray-400 text-sm">Conversion Rate</p>
              <p className="text-xs text-green-400 mt-1">
                {analyticsData.overview.totalConversions} of {analyticsData.overview.totalResponses} responses converted
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                ${analyticsData.overview.avgGMVPerCreator}
              </div>
              <p className="text-gray-400 text-sm">Avg GMV per Creator</p>
              <p className="text-xs text-blue-400 mt-1">
                Based on {analyticsData.overview.totalConversions} successful conversions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                94.2%
              </div>
              <p className="text-gray-400 text-sm">Message Delivery Rate</p>
              <p className="text-xs text-yellow-400 mt-1">
                {Math.floor(analyticsData.overview.totalInvitations * 0.942)} of {analyticsData.overview.totalInvitations} delivered successfully
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
