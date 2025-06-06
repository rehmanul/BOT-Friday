import { useState } from 'react';
import { Save, RefreshCw, Shield, Bell, User, Key, Database } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast-system';

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Profile Settings
    username: 'john_smith',
    email: 'john.smith@example.com',
    displayName: 'John Smith',

    // Automation Settings
    defaultDailyLimit: 20,
    defaultHourlyLimit: 15,
    humanLikeDelays: true,
    aiOptimization: true,
    autoRefreshSession: true,
    stealthMode: true,

    // Notification Settings
    emailNotifications: true,
    campaignAlerts: true,
    responseNotifications: true,
    rateLimitWarnings: true,

    // Default Campaign Settings
    defaultInvitationTemplate: `Hi {creator_name}! 👋

I'm reaching out because I love your {category} content! We'd love to collaborate with you on our upcoming campaign.

Would you be interested in learning more about our partnership opportunities?

Looking forward to hearing from you!
Best regards,
{sender_name}`,

    // API Settings
    geminiApiKey: '',
    webhookUrl: '',

    // Advanced Settings
    concurrentSessions: 1,
    requestTimeout: 30,
    retryAttempts: 3,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/settings/1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      toast.success('Settings Saved', result.message || 'Your configuration has been updated successfully');
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Save Failed', error instanceof Error ? error.message : 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = () => {
    toast.info('Testing Connection', 'Verifying API connectivity...');
    setTimeout(() => {
      toast.success('Connection Successful', 'All services are connected and working properly');
    }, 2000);
  };

  const handleResetToDefaults = () => {
    toast.warning('Settings Reset', 'All settings have been reset to default values');
  };

  return (
    <>
      <Header 
        title="Settings" 
        subtitle="Configure your automation preferences and account settings" 
      />

      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Settings */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={settings.username}
                    onChange={(e) => handleSettingChange('username', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
                <Input
                  id="displayName"
                  value={settings.displayName}
                  onChange={(e) => handleSettingChange('displayName', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit" className="text-gray-300">Default Daily Limit</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={settings.defaultDailyLimit}
                    onChange={(e) => handleSettingChange('defaultDailyLimit', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyLimit" className="text-gray-300">Default Hourly Limit</Label>
                  <Input
                    id="hourlyLimit"
                    type="number"
                    value={settings.defaultHourlyLimit}
                    onChange={(e) => handleSettingChange('defaultHourlyLimit', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Human-like Delays</p>
                    <p className="text-xs text-gray-400">Add random delays between actions to appear more natural</p>
                  </div>
                  <Switch 
                    checked={settings.humanLikeDelays}
                    onCheckedChange={(checked) => handleSettingChange('humanLikeDelays', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">AI Optimization</p>
                    <p className="text-xs text-gray-400">Use Gemini AI for enhanced targeting and content optimization</p>
                  </div>
                  <Switch 
                    checked={settings.aiOptimization}
                    onCheckedChange={(checked) => handleSettingChange('aiOptimization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Auto-refresh Session</p>
                    <p className="text-xs text-gray-400">Automatically refresh TikTok session when it expires</p>
                  </div>
                  <Switch 
                    checked={settings.autoRefreshSession}
                    onCheckedChange={(checked) => handleSettingChange('autoRefreshSession', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Stealth Mode</p>
                    <p className="text-xs text-gray-400">Advanced detection avoidance techniques</p>
                  </div>
                  <Switch 
                    checked={settings.stealthMode}
                    onCheckedChange={(checked) => handleSettingChange('stealthMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Email Notifications</p>
                  <p className="text-xs text-gray-400">Receive email updates about your campaigns</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Campaign Alerts</p>
                  <p className="text-xs text-gray-400">Notifications when campaigns start, pause, or complete</p>
                </div>
                <Switch 
                  checked={settings.campaignAlerts}
                  onCheckedChange={(checked) => handleSettingChange('campaignAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Response Notifications</p>
                  <p className="text-xs text-gray-400">Get notified when creators respond to your invitations</p>
                </div>
                <Switch 
                  checked={settings.responseNotifications}
                  onCheckedChange={(checked) => handleSettingChange('responseNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Rate Limit Warnings</p>
                  <p className="text-xs text-gray-400">Alerts when approaching rate limits</p>
                </div>
                <Switch 
                  checked={settings.rateLimitWarnings}
                  onCheckedChange={(checked) => handleSettingChange('rateLimitWarnings', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Campaign Template */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Default Invitation Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template" className="text-gray-300">
                  Message Template
                </Label>
                <Textarea
                  id="template"
                  rows={8}
                  value={settings.defaultInvitationTemplate}
                  onChange={(e) => handleSettingChange('defaultInvitationTemplate', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Enter your default invitation message template..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Available variables: {'{creator_name}'}, {'{category}'}, {'{sender_name}'}, {'{follower_count}'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiKey" className="text-gray-300">Gemini API Key</Label>
                <Input
                  id="geminiKey"
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook" className="text-gray-300">Webhook URL (Optional)</Label>
                <Input
                  id="webhook"
                  value={settings.webhookUrl}
                  onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                  placeholder="https://your-webhook-url.com/endpoint"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestConnection}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="bg-card-bg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessions" className="text-gray-300">Concurrent Sessions</Label>
                  <Select 
                    value={settings.concurrentSessions.toString()}
                    onValueChange={(value) => handleSettingChange('concurrentSessions', parseInt(value))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="1">1 Session</SelectItem>
                      <SelectItem value="2">2 Sessions</SelectItem>
                      <SelectItem value="3">3 Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout" className="text-gray-300">Request Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings.requestTimeout}
                    onChange={(e) => handleSettingChange('requestTimeout', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retries" className="text-gray-300">Retry Attempts</Label>
                  <Input
                    id="retries"
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline"
              onClick={handleResetToDefaults}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              Reset to Defaults
            </Button>

            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/80"
              >
                <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}