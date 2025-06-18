import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Square, RefreshCw, Settings, Activity } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { AutomationStatus } from '@/components/automation/automation-status';
import { toast } from '@/components/ui/toast-system';
import { apiRequest } from '@/lib/queryClient';
import type { BrowserSession, RateLimits } from '@/types';
import { TikTokConnect } from '@/components/auth/tiktok-connect';

export default function Automation() {
  const userId = 1; // In a real app, this would come from authentication
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch browser session status
  const { data: session, refetch: refetchSession } = useQuery<BrowserSession>({
    queryKey: ['/api/session', userId],
  });

  // Fetch rate limits (mock data for demo)
  const rateLimits: RateLimits = {
    hourly: 12,
    daily: 127,
    resetTimes: {
      hourly: Date.now() + 45 * 60 * 1000, // 45 minutes from now
      daily: Date.now() + 18 * 60 * 60 * 1000, // 18 hours from now
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      await apiRequest('POST', `/api/session/${userId}/refresh`);
      await refetchSession();
      toast.success('Session Refreshed', 'TikTok session has been renewed successfully');
    } catch (error) {
      toast.error('Refresh Failed', error instanceof Error ? error.message : 'Failed to refresh session');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePauseAutomation = () => {
    toast.warning('Automation Paused', 'All running campaigns have been paused');
  };

  const handleStopAutomation = () => {
    toast.error('Automation Stopped', 'All automation activities have been stopped');
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <>
      <Header 
        title="Automation Control" 
        subtitle="Monitor and control your TikTok automation system" 
      />

      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">System Status</p>
                  <p className="text-lg font-semibold text-green-400">Operational</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Sessions</p>
                  <p className="text-lg font-semibold text-white">1</p>
                </div>
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Queue Status</p>
                  <p className="text-lg font-semibold text-white">12 Pending</p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400">
                  Processing
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Browser Session Management */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Browser Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`
                flex items-center justify-between p-4 rounded-lg border
                ${session?.isActive 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-red-500/20 border-red-500/30'
                }
              `}>
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${session?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
                  `} />
                  <div>
                    <p className={`
                      text-sm font-medium
                      ${session?.isActive ? 'text-green-400' : 'text-red-400'}
                    `}>
                      {session?.isActive ? 'TikTok Session Active' : 'Session Inactive'}
                    </p>
                    {session?.isActive && session.lastActivity && (
                      <p className="text-xs text-gray-400">
                        Last activity: {new Date(session.lastActivity).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={handleRefreshSession}
                  disabled={isRefreshing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              {/* Session Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                  Session Settings
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Auto-refresh session</p>
                      <p className="text-xs text-gray-400">Automatically refresh when session expires</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Stealth mode</p>
                      <p className="text-xs text-gray-400">Use advanced detection avoidance</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Human-like delays</p>
                      <p className="text-xs text-gray-400">Random delays between actions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting & Performance */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Rate Limits & Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rate Limits */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                  Current Usage
                </h4>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white">Hourly Limit</span>
                      <span className="text-sm text-gray-400">{rateLimits.hourly}/15</span>
                    </div>
                    <Progress value={(rateLimits.hourly / 15) * 100} className="h-2" />
                    <p className="text-xs text-gray-400 mt-1">
                      Resets in {formatTime(rateLimits.resetTimes.hourly - Date.now())}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white">Daily Limit</span>
                      <span className="text-sm text-gray-400">{rateLimits.daily}/200</span>
                    </div>
                    <Progress value={(rateLimits.daily / 200) * 100} className="h-2" />
                    <p className="text-xs text-gray-400 mt-1">
                      Resets in {formatTime(rateLimits.resetTimes.daily - Date.now())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                  Performance
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-lg font-bold text-green-400">94.2%</p>
                    <p className="text-xs text-gray-400">Success Rate</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-lg font-bold text-blue-400">2.3s</p>
                    <p className="text-xs text-gray-400">Avg Response</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    size="sm"
                    onClick={handlePauseAutomation}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause All
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleStopAutomation}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automation Status Component */}
        <AutomationStatus 
          userId={userId}
          session={session}
          rateLimits={rateLimits}
        />

        <TikTokConnect />
      </main>
    </>
  );
}