import OpenAI from 'openai';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  isConfigured: boolean;
  capabilities: string[];
}

export class AIModelManager {
  private perplexityApiKey?: string;
  private geminiApiKey?: string;

  constructor() {
    this.initializeModels();
    this.logMissingApiKeys();
  }

  private logMissingApiKeys() {
    const missingKeys = [];
    if (!process.env.GEMINI_API_KEY) missingKeys.push('GEMINI_API_KEY');
    if (!process.env.PERPLEXITY_API_KEY) missingKeys.push('PERPLEXITY_API_KEY');

    if (missingKeys.length > 0) {
      console.warn(`Missing API keys: ${missingKeys.join(', ')}. Some AI features will be unavailable.`);
    }
  }

  private initializeModels() {
    // Store other API keys
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        isConfigured: !!this.geminiApiKey,
        capabilities: ['Creator Discovery', 'Content Analysis', 'Performance Prediction']
      },
      {
        id: 'perplexity-sonar',
        name: 'Perplexity Sonar',
        provider: 'Perplexity',
        isConfigured: !!this.perplexityApiKey,
        capabilities: ['Real-time Search', 'Trend Analysis', 'Market Research']
      }
    ];
  }

  async generateCreatorAnalysis(creatorData: any, modelId: string): Promise<string> {
    const prompt = `Analyze this TikTok creator for brand collaboration potential:

Creator: @${creatorData.username}
Followers: ${creatorData.followers}
Engagement Rate: ${creatorData.engagementRate}%
Category: ${creatorData.category}
Average GMV: $${creatorData.avgGMV}

Provide analysis on:
1. Collaboration potential (1-10 score)
2. Brand alignment for phone repair services
3. Recommended approach strategy
4. Estimated conversion potential

Keep response concise and actionable.`;

    switch (modelId) {
      case 'perplexity-sonar':
        return this.generateWithPerplexity(prompt);
      case 'gemini-pro':
        return this.generateWithGemini(prompt);
      default:
        throw new Error('Model not supported');
    }
  }

  async optimizeInvitationMessage(template: string, creatorData: any, modelId: string): Promise<string> {
    const prompt = `Optimize this invitation message for TikTok creator @${creatorData.username}:

Original Message:
${template}

Creator Details:
- Followers: ${creatorData.followers}
- Category: ${creatorData.category}
- Engagement Rate: ${creatorData.engagementRate}%

Make the message more personalized and compelling while maintaining professionalism. Focus on phone repair services collaboration.`;

    switch (modelId) {
      case 'perplexity-sonar':
        return this.generateWithPerplexity(prompt);
      case 'gemini-pro':
        return this.generateWithGemini(prompt);
      default:
        throw new Error('Model not supported');
    }
  }

  private async generateWithPerplexity(prompt: string): Promise<string> {
    if (!this.perplexityApiKey) throw new Error('Perplexity not configured');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert TikTok marketing analyst specializing in creator collaborations for phone repair services.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    if (!this.geminiApiKey) throw new Error('Gemini not configured');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

// Export a singleton instance
export const aiModelManager = new AIModelManager();