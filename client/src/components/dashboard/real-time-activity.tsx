import { useState, useEffect } from 'react';
import { Activity, MessageSquare, UserPlus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityItem } from '@/types';

interface RealTimeActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function RealTimeActivity({ activities, isLoading }: RealTimeActivityProps) {
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (activities) {
      // Sort by timestamp and take the most recent 10
      const sorted = [...activities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      setRecentActivities(sorted);
    }
  }, [activities]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'creator_discovered':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'campaign_started':
      case 'campaign_paused':
        return <Settings className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'message_sent':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'creator_discovered':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'campaign_started':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'campaign_paused':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <Card className="bg-card-bg border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Real-time Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-bg border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as it happens</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActivityColor(activity.action)} variant="secondary">
                      {activity.action.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activity.details}
                  </p>
                  {activity.status && (
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : activity.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}