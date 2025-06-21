# Replit Project Guide

## Overview

This is a full-stack TypeScript application combining a React frontend with an Express backend. The application uses modern web development practices with a focus on type safety, performance, and developer experience. It includes web scraping capabilities through Puppeteer and uses PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers
- **Styling**: TailwindCSS with custom animations and utility classes
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Security**: Helmet for security headers, CORS for cross-origin requests
- **Rate Limiting**: Express rate limiter for API protection
- **Session Management**: Express sessions for user state
- **Runtime**: tsx for TypeScript execution

### Data Layer
- **Database**: PostgreSQL (configured via pg driver)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Drizzle-Zod integration for runtime type checking

## Key Components

### Web Scraping Module
- **Primary Tool**: Puppeteer for browser automation
- **Enhancement**: Puppeteer Extra with stealth plugin for detection avoidance
- **Use Case**: Likely for data collection or content extraction

### UI Component System
- **Icons**: Lucide React for consistent iconography
- **Styling Utilities**: 
  - Class Variance Authority for component variants
  - clsx for conditional class names
  - tailwind-merge for class deduplication

### HTTP Client
- **Library**: Axios for API requests
- **Integration**: Works with TanStack Query for caching and synchronization

## Data Flow

1. **Frontend → Backend**: React components use Axios to make HTTP requests to Express API endpoints
2. **Backend → Database**: Express routes use Drizzle ORM to interact with PostgreSQL
3. **Validation**: Zod schemas ensure data integrity at both API and database levels
4. **State Management**: TanStack Query manages server state, caching, and synchronization
5. **Web Scraping**: Puppeteer extracts data from external websites when needed

## External Dependencies

### Core Runtime
- Node.js 20 (specified in .replit configuration)
- TypeScript for type safety across the stack

### Database
- PostgreSQL database (driver included via pg package)
- Connection likely managed through environment variables

### Third-party Services
- Web scraping targets (accessed via Puppeteer)
- Potential external APIs (handled through Axios)

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 module
- **Package Manager**: npm (evidenced by package-lock.json)
- **Development Server**: Vite for frontend, tsx for backend TypeScript execution

### Production Considerations
- Cross-platform environment variables (cross-env package)
- Security headers and CORS configured for production deployment
- Session management setup for user authentication
- Rate limiting configured for API protection

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 21, 2025: Fixed Render deployment issue by updating build command to include devDependencies
  - Modified render.yaml to use `npm install --include=dev` instead of `npm install`
  - This ensures build tools (vite, esbuild) are available during deployment
- June 21, 2025: Initial setup