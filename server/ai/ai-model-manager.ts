import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  isConfigured: boolean;
  capabilities: string[];
}

export class AIModelManager {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private perplexityApiKey?: string;
  private geminiApiKey?: string;

  constructor() {
    this.initializeModels();
    this.logMissingApiKeys();
  }

  private logMissingApiKeys() {
    const missingKeys = [];
    if (!process.env.ANTHROPIC_API_KEY) missingKeys.push('ANTHROPIC_API_KEY');
    if (!process.env.OPENAI_API_KEY) missingKeys.push('OPENAI_API_KEY');
    if (!process.env.GEMINI_API_KEY) missingKeys.push('GEMINI_API_KEY');
    if (!process.env.PERPLEXITY_API_KEY) missingKeys.push('PERPLEXITY_API_KEY');
    
    if (missingKeys.length > 0) {
      console.warn(`Missing API keys: ${missingKeys.join(', ')}. Some AI features will be unavailable.`);
    }
  }

  private initializeModels() {
    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Store other API keys
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'anthropic-claude-sonnet-4',
        name: 'Claude Sonnet 4.0',
        provider: 'Anthropic',
        isConfigured: !!this.anthropic,
        capabilities: ['Content Generation', 'Creator Analysis', 'Campaign Optimization']
      },
      {
        id: 'openai-gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        isConfigured: !!this.openai,
        capabilities: ['Content Generation', 'Image Analysis', 'Creator Insights']
      },
      {
        id: 'perplexity-sonar',
        name: 'Perplexity Sonar',
        provider: 'Perplexity',
        isConfigured: !!this.perplexityApiKey,
        capabilities: ['Real-time Search', 'Trend Analysis', 'Market Research']
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        isConfigured: !!this.geminiApiKey,
        capabilities: ['Creator Discovery', 'Content Analysis', 'Performance Prediction']
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
      case 'anthropic-claude-sonnet-4':
        return this.generateWithAnthropic(prompt);
      case 'openai-gpt-4o':
        return this.generateWithOpenAI(prompt);
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
      case 'anthropic-claude-sonnet-4':
        return this.generateWithAnthropic(prompt);
      case 'openai-gpt-4o':
        return this.generateWithOpenAI(prompt);
      case 'perplexity-sonar':
        return this.generateWithPerplexity(prompt);
      case 'gemini-pro':
        return this.generateWithGemini(prompt);
      default:
        throw new Error('Model not supported');
    }
  }

  private async generateWithAnthropic(prompt: string): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic not configured');

    const message = await this.anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-sonnet-20240229',
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content || '';
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