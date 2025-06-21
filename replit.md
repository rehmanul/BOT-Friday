# TikTok Creator Outreach Bot

## Overview

This is a full-stack TikTok creator outreach automation platform built with Node.js, Express, React, and SQLite/PostgreSQL. The application enables users to discover TikTok creators, manage outreach campaigns, and automate collaboration invitations while respecting platform rate limits and terms of service.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

- **Frontend**: React with TypeScript, TailwindCSS, and Vite for fast development
- **Backend**: Express.js server with TypeScript for type safety
- **Database**: SQLite for development, PostgreSQL for production using Drizzle ORM
- **Automation**: Puppeteer-based browser automation with stealth plugins
- **AI Integration**: Multiple AI providers (Gemini, Perplexity) for creator discovery and content optimization

## Key Components

### Frontend Architecture
- **React with TypeScript**: Component-based UI with type safety
- **TailwindCSS**: Utility-first CSS framework for rapid styling
- **Vite**: Fast build tool with hot module replacement
- **Path aliases**: Clean imports using `@/` for client src and `@shared/` for shared types

### Backend Architecture
- **Express.js**: RESTful API server with middleware-based architecture
- **Drizzle ORM**: Type-safe database operations with schema definitions
- **Dual database support**: SQLite for development, PostgreSQL for production
- **Modular structure**: Separated routes, services, middleware, and utilities

### Database Layer
- **Schema-first approach**: Shared schema definitions between SQLite and PostgreSQL
- **User management**: Authentication and user settings storage
- **Campaign management**: Track outreach campaigns and their performance
- **Creator database**: Store discovered creators with engagement metrics
- **Activity logging**: Comprehensive audit trail for all operations

### Authentication & Security
- **API key validation**: Simple API key-based authentication for development
- **User session management**: Basic user ID header authentication (to be enhanced)
- **Rate limiting**: Comprehensive rate limiting system respecting TikTok's limits
- **Security headers**: Standard security headers for production deployment

### Automation Engine
- **Puppeteer integration**: Browser automation with stealth plugins to avoid detection
- **Rate limiting**: Hourly (15), daily (200), and weekly (1000) limits with minimum delays
- **Human-like behavior**: Random delays and user agent rotation
- **Session management**: Persistent browser sessions with cookie storage

### AI Services
- **Multi-provider support**: Gemini and Perplexity API integration
- **Creator discovery**: AI-powered creator recommendations based on criteria
- **Content optimization**: AI assistance for message templates and campaigns
- **Fallback mechanisms**: Mock data generation when AI services are unavailable

## Data Flow

1. **User Authentication**: Users authenticate via API key or user ID headers
2. **Campaign Creation**: Users define outreach campaigns with targeting criteria
3. **Creator Discovery**: AI services suggest relevant creators based on campaign parameters
4. **Automation Execution**: Puppeteer automates TikTok interactions while respecting rate limits
5. **Progress Tracking**: Real-time updates on campaign performance and creator responses
6. **Analytics**: Dashboard showing campaign metrics and ROI analysis

## External Dependencies

### Core Dependencies
- **Express**: Web server framework
- **Drizzle ORM**: Database operations and migrations
- **Puppeteer**: Browser automation
- **React**: Frontend framework
- **TailwindCSS**: CSS framework

### AI & API Services
- **Google Gemini API**: AI-powered creator discovery and content generation
- **Perplexity API**: Enhanced search and research capabilities
- **TikTok Business API**: Official TikTok integration for creator data

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESLint & Prettier**: Code quality and formatting
- **Better SQLite3**: Local database for development

## Deployment Strategy

### Development Environment
- **SQLite database**: Local file-based database for rapid development
- **Vite dev server**: Hot module replacement for frontend development
- **Mock data**: Fallback data when external APIs are unavailable

### Production Environment
- **PostgreSQL**: Scalable relational database for production workloads
- **Environment validation**: Strict validation of required environment variables
- **Logging system**: Comprehensive logging with different levels and file output
- **Health checks**: System health monitoring with service status reporting

### Replit Deployment
- **Port configuration**: Server runs on port 5000 with external port 80 mapping
- **Nix dependencies**: Chromium and system libraries for Puppeteer support
- **Environment secrets**: Secure storage of API keys and sensitive configuration
- **Automated deployment**: Shell scripts for production deployment with validation

## Changelog

- June 21, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.