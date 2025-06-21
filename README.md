
# TikTok Creator Outreach Platform

A professional platform for automated TikTok creator outreach and campaign management.

## Features

- 🎯 **Creator Discovery**: AI-powered creator search and discovery
- 📊 **Analytics Dashboard**: Real-time campaign performance tracking
- 🤖 **Automation**: Intelligent outreach automation with rate limiting
- 🔐 **TikTok Integration**: Official TikTok API integration
- 📱 **Responsive Design**: Modern, mobile-first interface

## Production Deployment

### Prerequisites

1. **TikTok Developer Account**: Get your App ID and Secret from [TikTok for Developers](https://developers.tiktok.com/)
2. **Replit Account**: Deploy on Replit for best performance

### Environment Variables

Set these in Replit Secrets:

```bash
# Required for production
TIKTOK_APP_ID=your_app_id_here
TIKTOK_APP_SECRET=your_app_secret_here
API_KEY=generate_strong_random_key

# Optional - AI Features
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key

# Optional - Admin Setup
ADMIN_EMAIL=your_admin_email@domain.com
ADMIN_PASSWORD_HASH=your_secure_hash
```

### Deployment Steps

1. Fork this repl or import the code
2. Set environment variables in Replit Secrets
3. Update `TIKTOK_REDIRECT_URI` in `.env.production` with your domain
4. Run the production workflow
5. Access your app at your Replit URL

### Security Notes

- Change default admin credentials after first deployment
- Use strong API keys and secrets
- Regular security updates recommended

## Development

```bash
npm install
npm run dev
```

## Database

Uses SQLite with automatic migrations. Production database is separate from development.

## Rate Limiting

Configured for TikTok API limits:
- 15 requests/hour
- 200 requests/day  
- 1000 requests/week

## Support

For issues or questions, check the logs in `/logs` directory.
