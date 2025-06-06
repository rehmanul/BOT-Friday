import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/use-websocket';
import type { BrowserSession, RateLimits } from '@/types';

interface AutomationStatusProps {
  userId: number;
  session?: BrowserSession;
  rateLimits: RateLimits;
}

export function AutomationStatus({ userId, session, rateLimits }: AutomationStatusProps) {
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const { onMessage, offMessage } = useWebSocket(userId);

  useEffect(() => {
    const handleAutomationUpdate = (message: any) => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date(),
        type: message.type,
        message: getLogMessage(message.type, message),
        status: getLogStatus(message.type)
      };
      
      setAutomationLogs(prev => [newLog, ...prev].slice(0, 20)); // Keep last 20 logs
    };

    onMessage('invitation_sent', handleAutomationUpdate);
    onMessage('invitation_failed', handleAutomationUpdate);
    onMessage('rate_limit_reached', handleAutomationUpdate);
    onMessage('session_refreshed', handleAutomationUpdate);

    return () => {
      offMessage('invitation_sent');
      offMessage('invitation_failed');
      offMessage('rate_limit_reached');
      offMessage('session_refreshed');
    };
  }, [userId, onMessage, offMessage]);

  const getLogMessage = (type: string, data: any) => {
    switch (type) {
      case 'invitation_sent':
        return `Invitation sent to @${data.creator?.username || 'creator'}`;
      case 'invitation_failed':
        return `Failed to send invitation: ${data.error || 'Unknown error'}`;
      case 'rate_limit_reached':
        return 'Rate limit reached, automation paused';
      case 'session_refreshed':
        return 'Browser session refreshed successfully';
      default:
        return `${type} event occurred`;
    }
  };

  const getLogStatus = (type: string): 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'invitation_sent':
      case 'session_refreshed':
        return 'success';
      case 'rate_limit_reached':
        return 'warning';
      case 'invitation_failed':
        return 'error';
      default:
        return 'success';
    }
  };

  const getLogIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRateLimitPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const isSessionActive = session?.isActive || false;
  const hourlyPercentage = getRateLimitPercentage(rateLimits.hourly, 15);
  const dailyPercentage = getRateLimitPercentage(rateLimits.daily, 200);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Status */}
      <Card className="bg-card-bg border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Automation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Status */}
          <div className="space-y-3">
            <div className={`
              flex items-center justify-between p-3 rounded-lg border
              ${isSessionActive 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-red-500/20 border-red-500/30'
              }
            `}>
              <div className="flex items-center space-x-2">
                <div className={`
                  w-2 h-2 rounded-full
                  ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
                `} />
                <span className={`text-sm font-medium ${
                  isSessionActive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isSessionActive ? 'Automation Active' : 'Automation Inactive'}
                </span>
              </div>
              <Badge className={
                isSessionActive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }>
                {isSessionActive ? 'Running' : 'Stopped'}
              </Badge>
            </div>
          </div>

          {/* Rate Limits */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              Rate Limits
            </h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white">Hourly Usage</span>
                  <span className="text-sm text-gray-400">{rateLimits.hourly}/15</span>
                </div>
                <Progress 
                  value={hourlyPercentage} 
                  className={`h-2 ${hourlyPercentage > 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-primary'}`} 
                />
                {hourlyPercentage > 80 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Approaching hourly limit
                  </p>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white">Daily Usage</span>
                  <span className="text-sm text-gray-400">{rateLimits.daily}/200</span>
                </div>
                <Progress 
                  value={dailyPercentage} 
                  className={`h-2 ${dailyPercentage > 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-primary'}`} 
                />
                {dailyPercentage > 80 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Approaching daily limit
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              Performance Metrics
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-lg font-bold text-green-400">98.2%</p>
                <p className="text-xs text-gray-400">Uptime</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-lg font-bold text-blue-400">1.8s</p>
                <p className="text-xs text-gray-400">Avg Response</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-lg font-bold text-purple-400">12</p>
                <p className="text-xs text-gray-400">Queue Size</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card className="bg-card-bg border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {automationLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No recent activity</p>
                <p className="text-gray-500 text-xs">Activity will appear here when automation is running</p>
              </div>
            ) : (
              automationLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    {getLogIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
