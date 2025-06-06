import { useEffect, useState } from 'react';
import { CheckCircle, Bot, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/use-websocket';
import type { ActivityLog } from '@/types';

interface RealTimeActivityProps {
  userId: number;
  activities: ActivityLog[];
}

export function RealTimeActivity({ userId, activities }: RealTimeActivityProps) {
  const [realtimeActivities, setRealtimeActivities] = useState<ActivityLog[]>(activities);
  const { onMessage, offMessage } = useWebSocket(userId);

  useEffect(() => {
    setRealtimeActivities(activities);
  }, [activities]);

  useEffect(() => {
    const handleActivityUpdate = (message: any) => {
      if (message.type === 'invitation_sent' || 
          message.type === 'campaign_started' || 
          message.type === 'session_refreshed') {
        
        const newActivity: ActivityLog = {
          id: Date.now(),
          userId,
          campaignId: message.campaign || null,
          type: message.type,
          message: getMessageFromType(message.type, message),
          metadata: message,
          timestamp: new Date().toISOString()
        };
        
        setRealtimeActivities(prev => [newActivity, ...prev].slice(0, 50));
      }
    };

    onMessage('invitation_sent', handleActivityUpdate);
    onMessage('campaign_started', handleActivityUpdate);
    onMessage('campaign_paused', handleActivityUpdate);
    onMessage('session_refreshed', handleActivityUpdate);

    return () => {
      offMessage('invitation_sent');
      offMessage('campaign_started');
      offMessage('campaign_paused');
      offMessage('session_refreshed');
    };
  }, [userId, onMessage, offMessage]);

  const getMessageFromType = (type: string, data: any) => {
    switch (type) {
      case 'invitation_sent':
        return `Invitation sent to @${data.creator?.username || 'creator'}`;
      case 'campaign_started':
        return `Campaign started successfully`;
      case 'campaign_paused':
        return `Campaign paused`;
      case 'session_refreshed':
        return `TikTok session refreshed`;
      default:
        return `${type} event occurred`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invitation_sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'campaign_started':
      case 'campaign_completed':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'rate_limit_reached':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'response_received':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'invitation_failed':
      case 'session_refresh':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} minutes ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="bg-card-bg border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white flex items-center">
          Real-time Activity
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="p-6 space-y-4">
            {realtimeActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No activity yet</p>
                <p className="text-sm text-gray-500 mt-1">Activity will appear here in real-time</p>
              </div>
            ) : (
              realtimeActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
