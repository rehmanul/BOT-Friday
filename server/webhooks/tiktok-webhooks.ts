import { Request, Response } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

export class TikTokWebhookHandler {
  private readonly WEBHOOK_SECRET = process.env.TIKTOK_WEBHOOK_SECRET || 'default-secret';

  // Handle incoming webhook events
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook signature
      const signature = req.headers['x-tiktok-signature'] as string;
      const timestamp = req.headers['x-tiktok-timestamp'] as string;

      if (!this.verifySignature(req.body, signature, timestamp)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const { event_type, data } = req.body;

      switch (event_type) {
        case 'video.published':
          await this.handleVideoPublished(data);
          break;
        case 'engagement.updated':
          await this.handleEngagementUpdate(data);
          break;
        case 'creator.followed':
          await this.handleCreatorFollowed(data);
          break;
        case 'message.received':
          await this.handleMessageReceived(data);
          break;
        default:
          console.log('Unknown webhook event:', event_type);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Verify webhook signature
  private verifySignature(payload: any, signature: string, timestamp: string): boolean {
    try {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.WEBHOOK_SECRET)
        .update(timestamp + payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Handle video published event
  private async handleVideoPublished(data: any): Promise<void> {
    try {
      const { creator_id, video_id, engagement_data } = data;

      // Update creator statistics
      const engagementRate = this.calculateEngagementRate(engagement_data);

      await storage.updateCreatorStats(creator_id, {
        lastVideoId: video_id,
        lastVideoEngagement: engagementRate,
        lastActivity: new Date()
      });

      // Log activity
      await storage.createActivityLog({
        userId: 1, // System user
        type: 'video_published',
        message: `Creator ${creator_id} published new video ${video_id}`,
        metadata: { creatorId: creator_id, videoId: video_id, engagementRate },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling video published:', error);
    }
  }

  // Handle engagement update
  private async handleEngagementUpdate(data: any): Promise<void> {
    try {
      const { creator_id, video_id, engagement_data } = data;
      const engagementRate = this.calculateEngagementRate(engagement_data);

      await storage.updateCreatorEngagement(creator_id, engagementRate);
    } catch (error) {
      console.error('Error handling engagement update:', error);
    }
  }

  // Handle creator followed
  private async handleCreatorFollowed(data: any): Promise<void> {
    try {
      const { creator_id, follower_count } = data;

      await storage.updateCreatorFollowers(creator_id, follower_count);
    } catch (error) {
      console.error('Error handling creator followed:', error);
    }
  }

  // Handle message received
  private async handleMessageReceived(data: any): Promise<void> {
    try {
      const { creator_id, message_content, campaign_id } = data;

      // Update campaign invitation status if this is a response
      if (campaign_id) {
        const invitation = await storage.getCampaignInvitationByCreator(campaign_id, creator_id);
        if (invitation) {
          await storage.updateCampaignInvitation(invitation.id, {
            status: 'responded',
            responseMessage: message_content,
            respondedAt: new Date()
          });
        }
      }

      // Log the message
      await storage.createActivityLog({
        userId: 1,
        campaignId: campaign_id,
        type: 'message_received',
        message: `Received message from creator ${creator_id}`,
        metadata: { creatorId: creator_id, messageContent: message_content },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling message received:', error);
    }
  }

  // Calculate engagement rate
  private calculateEngagementRate(engagementData: any): number {
    if (!engagementData.likes || !engagementData.views) return 0;

    const totalEngagement = engagementData.likes + engagementData.comments + engagementData.shares;
    const engagementRate = (totalEngagement / engagementData.views) * 100;

    return Math.round(engagementRate * 100) / 100; // Round to 2 decimal places
  }

  // Generate webhook verification endpoint
  async handleWebhookVerification(req: Request, res: Response): Promise<void> {
    const challenge = req.query.challenge as string;

    if (challenge) {
      res.status(200).send(challenge);
    } else {
      res.status(400).json({ error: 'No challenge provided' });
    }
  }
}