
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, User, CheckCircle } from 'lucide-react';

interface TikTokConnectProps {
  userId: number;
  isConnected: boolean;
  profile?: {
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  onConnect?: () => void;
}

export function TikTokConnect({ userId, isConnected, profile, onConnect }: TikTokConnectProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/auth/tiktok');
      const data = await response.json();
      if (data.authURL) {
        window.location.href = data.authURL;
      }
    } catch (error) {
      console.error('Failed to connect to TikTok:', error);
      setConnecting(false);
    }
  };

  if (isConnected && profile) {
    return (
      <Card className="bg-card-bg border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            TikTok Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="text-white font-medium flex items-center">
                {profile.displayName}
                {profile.verified && (
                  <CheckCircle className="h-4 w-4 ml-1 text-blue-500" />
                )}
              </h3>
              <p className="text-sm text-gray-400">@{profile.username}</p>
              <p className="text-sm text-gray-400">
                {profile.followers.toLocaleString()} followers
              </p>
            </div>
          </div>
          <div className="text-sm text-green-400">
            ✓ Account connected and ready for automation
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-bg border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <User className="h-5 w-5 mr-2" />
          Connect TikTok Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-400 text-sm">
          Connect your TikTok account to enable real-time automation with the official TikTok API.
        </p>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Send direct messages to creators
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Search and discover creators
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Real-time analytics and insights
          </div>
        </div>
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full bg-[#ff0050] hover:bg-[#e6004a] text-white"
        >
          {connecting ? (
            'Connecting...'
          ) : (
            <>
              Connect TikTok Account
              <ExternalLink className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
