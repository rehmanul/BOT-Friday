export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Gemini API key not found. AI features will be limited.");
    }
  }

  async discoverCreators(criteria: any, count: number = 10): Promise<any[]> {
    try {
      if (!this.apiKey) {
        return this.generateMockCreators(criteria, count);
      }

      const prompt = `
        Based on the following criteria, suggest TikTok creators for brand collaboration:
        - Category: ${criteria.category || 'any'}
        - Minimum followers: ${criteria.minFollowers || 10000}
        - Target demographic: ${criteria.demographic || 'general'}
        - Budget range: ${criteria.budget || 'flexible'}
        
        Please provide ${count} creators with the following format for each:
        {
          "username": "@creator_username",
          "displayName": "Creator Display Name",
          "followers": 125000,
          "category": "Fashion",
          "engagementRate": 8.5,
          "gmv": 25000,
          "profileData": {
            "description": "Brief description",
            "avgViews": 50000,
            "recentPosts": 15
          }
        }
        
        Return only valid JSON array.
      `;

      const response = await this.callGeminiAPI(prompt);
      return this.parseCreatorResponse(response);

    } catch (error) {
      console.error('AI creator discovery error:', error);
      return this.generateMockCreators(criteria, count);
    }
  }

  async optimizeInvitationMessage(template: string, creatorProfile: any): Promise<string> {
    try {
      if (!this.apiKey) {
        return this.personalizeTemplate(template, creatorProfile);
      }

      const prompt = `
        Personalize this invitation message for a TikTok creator:
        
        Template: "${template}"
        
        Creator profile:
        - Username: ${creatorProfile.username}
        - Category: ${creatorProfile.category}
        - Followers: ${creatorProfile.followers}
        - Recent content themes: ${creatorProfile.recentThemes || 'general lifestyle'}
        
        Make the message:
        1. Personalized and relevant to their content
        2. Professional but friendly
        3. Clear about the collaboration opportunity
        4. Under 200 characters
        5. Engaging and likely to get a response
        
        Return only the optimized message text.
      `;

      const response = await this.callGeminiAPI(prompt);
      return response.trim() || this.personalizeTemplate(template, creatorProfile);

    } catch (error) {
      console.error('AI message optimization error:', error);
      return this.personalizeTemplate(template, creatorProfile);
    }
  }

  async analyzeCreatorCompatibility(creator: any, campaign: any): Promise<number> {
    try {
      if (!this.apiKey) {
        return this.calculateBasicCompatibility(creator, campaign);
      }

      const prompt = `
        Analyze the compatibility between this creator and campaign:
        
        Creator:
        - Category: ${creator.category}
        - Followers: ${creator.followers}
        - Engagement rate: ${creator.engagementRate}%
        - GMV: $${creator.gmv}
        
        Campaign:
        - Category: ${campaign.filters?.category || 'general'}
        - Target followers: ${campaign.filters?.minFollowers || 10000}+
        - Budget: ${campaign.filters?.budget || 'flexible'}
        
        Return a compatibility score from 0-100 based on:
        1. Category alignment
        2. Audience size match
        3. Engagement quality
        4. Historical performance
        5. Brand safety
        
        Return only the numeric score.
      `;

      const response = await this.callGeminiAPI(prompt);
      const score = parseInt(response.trim());
      return isNaN(score) ? this.calculateBasicCompatibility(creator, campaign) : Math.max(0, Math.min(100, score));

    } catch (error) {
      console.error('AI compatibility analysis error:', error);
      return this.calculateBasicCompatibility(creator, campaign);
    }
  }

  async generateCampaignInsights(campaignStats: any): Promise<any> {
    try {
      if (!this.apiKey) {
        return this.generateBasicInsights(campaignStats);
      }

      const prompt = `
        Analyze this campaign performance and provide insights:
        
        Stats:
        - Invitations sent: ${campaignStats.sent}
        - Responses received: ${campaignStats.responses}
        - Response rate: ${campaignStats.responseRate}%
        - Conversions: ${campaignStats.conversions || 0}
        
        Provide insights on:
        1. Performance assessment (good/average/poor)
        2. Key strengths
        3. Areas for improvement
        4. Recommended next actions
        5. Optimization suggestions
        
        Return as JSON with keys: assessment, strengths, improvements, recommendations, optimizations
      `;

      const response = await this.callGeminiAPI(prompt);
      const insights = JSON.parse(response);
      return insights;

    } catch (error) {
      console.error('AI insights generation error:', error);
      return this.generateBasicInsights(campaignStats);
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  private parseCreatorResponse(response: string): any[] {
    try {
      const creators = JSON.parse(response);
      return Array.isArray(creators) ? creators : [];
    } catch (error) {
      console.error('Failed to parse creator response:', error);
      return [];
    }
  }

  private generateMockCreators(criteria: any, count: number): any[] {
    const categories = ['Fashion', 'Gaming', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Fitness'];
    const mockCreators = [];

    for (let i = 0; i < count; i++) {
      const category = criteria.category || categories[Math.floor(Math.random() * categories.length)];
      const followers = Math.floor(Math.random() * 500000) + (criteria.minFollowers || 10000);
      
      mockCreators.push({
        username: `@creator_${category.toLowerCase()}_${i + 1}`,
        displayName: `${category} Creator ${i + 1}`,
        followers,
        category,
        engagementRate: Math.random() * 10 + 5, // 5-15%
        gmv: Math.floor(Math.random() * 50000) + 5000,
        profileData: {
          description: `${category} content creator with ${followers} followers`,
          avgViews: Math.floor(followers * 0.1),
          recentPosts: Math.floor(Math.random() * 20) + 10
        }
      });
    }

    return mockCreators;
  }

  private personalizeTemplate(template: string, creatorProfile: any): string {
    let personalized = template;
    
    // Replace placeholders
    personalized = personalized.replace(/{creator_name}/g, creatorProfile.displayName || creatorProfile.username);
    personalized = personalized.replace(/{username}/g, creatorProfile.username);
    personalized = personalized.replace(/{category}/g, creatorProfile.category || 'content');
    personalized = personalized.replace(/{follower_count}/g, creatorProfile.followers?.toLocaleString() || 'many');

    return personalized;
  }

  private calculateBasicCompatibility(creator: any, campaign: any): number {
    let score = 50; // Base score

    // Category match
    if (campaign.filters?.category === creator.category) {
      score += 30;
    } else if (creator.category) {
      score += 10;
    }

    // Follower count match
    const minFollowers = campaign.filters?.minFollowers || 10000;
    if (creator.followers >= minFollowers) {
      score += 20;
    }

    // Engagement rate bonus
    if (creator.engagementRate > 5) {
      score += Math.min(20, creator.engagementRate);
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateBasicInsights(stats: any): any {
    const responseRate = stats.responseRate || 0;
    
    let assessment = 'poor';
    if (responseRate > 50) assessment = 'excellent';
    else if (responseRate > 30) assessment = 'good';
    else if (responseRate > 15) assessment = 'average';

    return {
      assessment,
      strengths: responseRate > 30 ? ['High response rate', 'Good creator targeting'] : ['Campaign is active'],
      improvements: responseRate < 30 ? ['Improve message personalization', 'Better creator targeting'] : ['Optimize conversion rate'],
      recommendations: ['A/B test different message templates', 'Focus on high-engagement creators'],
      optimizations: ['Use AI-powered creator scoring', 'Implement smart timing for outreach']
    };
  }
}

// Export a singleton instance
export const aiService = new AIService();
