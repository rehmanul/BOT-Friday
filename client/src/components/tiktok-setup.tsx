import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface TikTokStatus {
  connected: boolean;
  hasToken: boolean;
  needsAuth: boolean;
  error: string | null;
  scopeIssue: boolean;
  tokenStatus: string;
  authURL: string | null;
  apiType: string;
  advertiserId: string;
  appId: string;
  sandboxMode: boolean;
  requiredScopes: string[];
  tokenGenerationUrl: string;
}

export function TikTokSetup() {
  const [status, setStatus] = useState<TikTokStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/tiktok/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch TikTok status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading TikTok status...</div>;
  }

  if (!status) {
    return <div className="p-4">Failed to load TikTok status</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          TikTok API Status
          <Badge variant={status.sandboxMode ? "secondary" : "default"}>
            {status.sandboxMode ? "Sandbox" : "Production"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>App ID:</strong> {status.appId}
          </div>
          <div>
            <strong>Advertiser ID:</strong> {status.advertiserId}
          </div>
          <div>
            <strong>Token Status:</strong> {status.tokenStatus}
          </div>
          <div>
            <strong>API Type:</strong> {status.apiType}
          </div>
        </div>

        {status.scopeIssue && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Scope Permission Error</strong><br />
              Your access token doesn't have the required API permissions. 
              Generate a new token with these scopes:
            </AlertDescription>
          </Alert>
        )}

        {status.requiredScopes && (
          <div>
            <h4 className="font-medium mb-2">Required API Scopes:</h4>
            <div className="flex flex-wrap gap-2">
              {status.requiredScopes.map((scope) => (
                <Badge key={scope} variant="outline">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {status.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {status.scopeIssue && (
            <Button asChild>
              <a href={status.tokenGenerationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Generate New Token
              </a>
            </Button>
          )}
          
          {status.authURL && (
            <Button asChild variant="outline">
              <a href={status.authURL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                OAuth Authorization
              </a>
            </Button>
          )}

          <Button onClick={fetchStatus} variant="outline">
            Refresh Status
          </Button>
        </div>

        {status.sandboxMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Sandbox Mode:</strong> You're using TikTok's sandbox environment. 
              No real ads will be created or charged. Perfect for testing the bot.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}