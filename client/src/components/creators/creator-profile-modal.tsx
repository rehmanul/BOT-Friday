import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Users, TrendingUp, DollarSign, CheckCircle, ExternalLink } from 'lucide-react';

interface Creator {
  id: number;
  username: string;
  displayName?: string;
  followers: number;
  engagementRate: number;
  category?: string;
  gmv?: number;
  profilePicture?: string;
  isVerified?: boolean;
  bio?: string;
  isActive?: boolean;
  lastUpdated?: Date;
}

interface CreatorProfileModalProps {
  creator: Creator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatorProfileModal({ creator, open, onOpenChange }: CreatorProfileModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!creator) {
    return null;
  }

  const handleSendInvitation = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/campaigns/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          message: message.trim()
        })
      });

      if (response.ok) {
        setMessage('');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
    } finally {
      setSending(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const displayName = creator.displayName || creator.username || 'Unknown';
  const username = creator.username || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Creator Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Creator Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={creator.profilePicture} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold">{displayName}</h3>
                {creator.isVerified && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-400">@{username}</p>
              {creator.bio && (
                <p className="text-sm text-gray-300 mt-2">{creator.bio}</p>
              )}
              {creator.category && (
                <Badge variant="secondary" className="mt-2">
                  {creator.category}
                </Badge>
              )}
            </div>

            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-400">Followers</span>
              </div>
              <p className="text-2xl font-bold mt-1">{formatNumber(creator.followers)}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-400">Engagement</span>
              </div>
              <p className="text-2xl font-bold mt-1">{creator.engagementRate?.toFixed(1) || '0'}%</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Avg GMV</span>
              </div>
              <p className="text-2xl font-bold mt-1">${formatNumber(creator.gmv)}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-gray-400">Status</span>
              </div>
              <p className="text-sm font-medium mt-1">
                {creator.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {/* Send Invitation */}
          <div className="space-y-4">
            <Label htmlFor="invitation-message">Send Invitation</Label>
            <Textarea
              id="invitation-message"
              placeholder="Write a personalized message to invite this creator to your campaign..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={!message.trim() || sending}
              >
                {sending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}