import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ExternalLink, 
  Send, 
  Eye, 
  TrendingUp, 
  Users,
  MapPin,
  Calendar
} from 'lucide-react';
import { CreatorProfileModal } from './creator-profile-modal';

export interface Creator {
  id: string;
  username: string;
  followers: number;
  engagement: number;
  category: string;
  status: 'active' | 'pending' | 'inactive';
  gmv: number;
  location?: string;
  joinedDate?: string;
  avatar?: string;
}

interface CreatorTableProps {
  creators: Creator[];
  onSendInvite?: (creatorId: string) => void;
  onViewProfile?: (creatorId: string) => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function CreatorTable({ creators, onSendInvite, onViewProfile }: CreatorTableProps) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const handleViewProfile = (creator: Creator) => {
    setSelectedCreator(creator);
    onViewProfile?.(creator.id);
  };

  const handleSendInvite = (creatorId: string) => {
    onSendInvite?.(creatorId);
    // Show success toast or notification
  };

  const openTikTokProfile = (username: string) => {
    window.open(`https://www.tiktok.com/@${username}`, '_blank');
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {creators.map((creator) => (
          <Card key={creator.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-6">
              {/* Creator Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {creator.avatar ? (
                    <img 
                      src={creator.avatar} 
                      alt={creator.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {creator.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">@{creator.username}</h3>
                  <p className="text-sm text-gray-400">{creator.category}</p>
                </div>
                <Badge 
                  variant={creator.status === 'active' ? 'default' : 'secondary'}
                  className={creator.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                >
                  {creator.status}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-gray-400 mb-1">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-lg font-bold text-white">{formatNumber(creator.followers)}</div>
                  <div className="text-xs text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-gray-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-lg font-bold text-white">{creator.engagement}%</div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 mb-4 text-sm">
                {creator.location && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{creator.location}</span>
                  </div>
                )}
                {creator.joinedDate && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {creator.joinedDate}</span>
                  </div>
                )}
                <div className="text-gray-400">
                  <span className="font-medium">GMV:</span> ${formatNumber(creator.gmv)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewProfile(creator)}
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={() => openTikTokProfile(creator.username)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  TikTok
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSendInvite(creator.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Creator Profile Modal */}
      {selectedCreator && (
        <CreatorProfileModal
          creator={selectedCreator}
          isOpen={!!selectedCreator}
          onClose={() => setSelectedCreator(null)}
        />
      )}
    </>
  );
}