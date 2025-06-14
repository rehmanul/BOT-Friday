import { useState } from 'react';
import { CreatorTable, UICreator } from '@/components/creators/creator-table';
import { CreatorProfileModal } from '@/components/creators/creator-profile-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Filter, Download, UserPlus, Eye, MessageSquare, Send } from 'lucide-react';
import { useCreators, useDiscoverCreators } from '@/hooks/use-creators';
import { toast } from '@/components/ui/toast-system';
import type { CreatorFilters, Creator } from '@/types';
import { Header } from '@/components/layout/header';

export default function Creators() {
  const [filters, setFilters] = useState<CreatorFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCreators, setSelectedCreators] = useState<number[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState('');

  const itemsPerPage = 25;

  const { data, isLoading } = useCreators(
    filters, 
    itemsPerPage, 
    currentPage * itemsPerPage
  );

  const creatorsRaw = data?.creators || [];
  const totalCreators = data?.total || 0;

  // Normalize creators for UI table
  const creators: UICreator[] = creatorsRaw.map((c: Creator) => ({
    ...c,
    followers: typeof c.followers === 'number' ? c.followers : 0,
    engagement: c.engagementRate ? parseFloat(c.engagementRate) : 0,
    gmv: c.gmv ? parseFloat(c.gmv) : 0,
    status: 'active', // TODO: derive from backend if available
    location: c.profileData?.location || '',
    joinedDate: c.profileData?.joinedDate || '',
    avatar: c.profileData?.avatar || '',
    engagementRate: c.engagementRate ? parseFloat(c.engagementRate) : 0,
    displayName: c.displayName ?? undefined,
  }));

  const discoverCreatorsMutation = useDiscoverCreators();

  const handleFilterChange = (key: keyof CreatorFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(0);
  };

  const handleDiscoverCreators = async () => {
    try {
      const criteria = {
        category: filters.category,
        minFollowers: filters.minFollowers || 10000,
        demographic: 'general',
        budget: 'flexible'
      };

      const result = await discoverCreatorsMutation.mutateAsync({ criteria, count: 20 });
      toast.success(
        'Creators Discovered', 
        `Found ${result.discovered} new creators matching your criteria`
      );
    } catch (error) {
      toast.error(
        'Discovery Failed', 
        error instanceof Error ? error.message : 'Failed to discover creators'
      );
    }
  };

  const handleExportCreators = () => {
    // In a real implementation, this would trigger a CSV download
    toast.info('Export Started', 'Your creator database export is being prepared');
  };

  const handleCreatorSelect = (creatorId: number, selected: boolean) => {
    setSelectedCreators(prev => 
      selected 
        ? [...prev, creatorId]
        : prev.filter(id => id !== creatorId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedCreators(selected ? creators.map((c: any) => c.id) : []);
  };

  const handleBulkInvite = () => {
    if (selectedCreators.length === 0) {
      toast.warning('No Selection', 'Please select creators to invite');
      return;
    }

    toast.success(
      'Bulk Invitation', 
      `Invitations will be sent to ${selectedCreators.length} creators`
    );
    setSelectedCreators([]);
  };

  const handleViewProfile = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowProfileModal(true);
  };

  const handleSendInvitation = (creator: Creator) => {
    setSelectedCreator(creator);
    setInvitationMessage(`Hi @${creator.username},\n\nWe'd love to collaborate with you on promoting our phone repair services. Your content aligns perfectly with our brand values.\n\nWould you be interested in a partnership?\n\nBest regards,\nDigi4u Repair UK Team`);
    setShowInvitationDialog(true);
  };

  const handleViewTikTokProfile = (creator: Creator) => {
    window.open(`https://www.tiktok.com/@${creator.username}`, '_blank');
  };

  const handleSendInvitationMessage = async () => {
    if (!selectedCreator) return;

    try {
      const response = await fetch('/api/campaigns/send-invitation-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: selectedCreator.id,
          message: invitationMessage,
        }),
      });

      if (response.ok) {
        setShowInvitationDialog(false);
        setInvitationMessage('');
        setSelectedCreator(null);
        toast.success('Invitation Sent', 'The invitation was sent to TikTok successfully.');
      } else {
        const errorData = await response.json();
        toast.error('Send Failed', errorData.error || 'Failed to send invitation.');
      }
    } catch (error) {
      toast.error('Send Failed', error instanceof Error ? error.message : 'Failed to send invitation.');
      console.error('Failed to send invitation:', error);
    }
  };

  return (
    <>
      <Header 
        title="Creator Discovery" 
        subtitle="Find and manage TikTok creators for your campaigns" 
      />

      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Discovery Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Creators</p>
                  <p className="text-2xl font-bold text-white">{totalCreators}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Contacted</p>
                  <p className="text-2xl font-bold text-white">847</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Responded</p>
                  <p className="text-2xl font-bold text-white">394</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-bg border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Response Rate</p>
                  <p className="text-2xl font-bold text-white">46.5%</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  +8.2%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <Card className="bg-card-bg border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Creator Database</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportCreators}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  size="sm"
                  onClick={handleDiscoverCreators}
                  disabled={discoverCreatorsMutation.isPending}
                  className="bg-secondary hover:bg-secondary/80"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {discoverCreatorsMutation.isPending ? 'Discovering...' : 'AI Discover'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search creators by username or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <Select 
                value={filters.category || ''} 
                onValueChange={(value) => handleFilterChange('category', value || undefined)}
              >
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Fashion">Fashion & Beauty</SelectItem>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="Tech">Tech & Reviews</SelectItem>
                  <SelectItem value="Food">Food & Cooking</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.minFollowers?.toString() || ''} 
                onValueChange={(value) => handleFilterChange('minFollowers', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Min Followers" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Ranges</SelectItem>
                  <SelectItem value="10000">10K+</SelectItem>
                  <SelectItem value="50000">50K+</SelectItem>
                  <SelectItem value="100000">100K+</SelectItem>
                  <SelectItem value="500000">500K+</SelectItem>
                  <SelectItem value="1000000">1M+</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={clearFilters}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            {/* Selected Actions */}
            {selectedCreators.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-blue-400">
                  {selectedCreators.length} creator{selectedCreators.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm"
                    onClick={handleBulkInvite}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Invitations
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCreators([])}
                    className="border-slate-600"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            {/* Creator Table */}
            <CreatorTable 
              creators={creators}
              selectedCreators={selectedCreators}
              onSelect={handleCreatorSelect}
              onSelectAll={handleSelectAll}
              onViewProfile={(c: number) => handleViewProfile(creatorsRaw.find((cr: Creator) => cr.id === c) as Creator)}
              onSendInvite={(c: number) => handleSendInvitation(creatorsRaw.find((cr: Creator) => cr.id === c) as Creator)}
            />
          
            {/* Creator Profile Modal */}
            {selectedCreator && (
              <CreatorProfileModal
                creator={{
                  ...selectedCreator,
                  engagementRate: typeof selectedCreator.engagementRate === 'number' ? selectedCreator.engagementRate : 0,
                  displayName: selectedCreator.displayName ?? undefined,
                  followers: typeof selectedCreator.followers === 'number' ? selectedCreator.followers : 0,
                  category: selectedCreator.category ?? undefined,
                  gmv: typeof selectedCreator.gmv === 'number' ? selectedCreator.gmv : 0,
                  lastUpdated: selectedCreator.lastUpdated ? new Date(selectedCreator.lastUpdated) : undefined,
                }}
                open={showProfileModal}
                onOpenChange={(open) => {
                  setShowProfileModal(open);
                  if (!open) setSelectedCreator(null);
                }}
              />
            )}
          
            {/* Invitation Dialog */}
            <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Send Invitation to @{selectedCreator?.username}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="message" className="text-white">
                      Invitation Message
                    </Label>
                    <Textarea
                      id="message"
                      value={invitationMessage}
                      onChange={(e) => setInvitationMessage(e.target.value)}
                      rows={8}
                      className="bg-slate-900 border-slate-600 text-white"
                      placeholder="Write your invitation message..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowInvitationDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendInvitationMessage}
                      disabled={!invitationMessage.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-400">
                Showing {totalCreators === 0 ? 0 : currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, totalCreators)} of {totalCreators} creators
              </p>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Previous
                </Button>
                <span className="px-3 py-1 bg-primary text-white rounded text-sm">
                  {currentPage + 1}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={(currentPage + 1) * itemsPerPage >= totalCreators}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}