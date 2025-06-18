
import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // For now, we'll use a simple user ID from headers
    // In production, implement proper JWT or session authentication
    const userIdHeader = req.headers['x-user-id'] as string;
    
    if (!userIdHeader) {
      throw new AppError('Authentication required', 401, 'auth');
    }

    const userId = parseInt(userIdHeader);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400, 'auth');
    }

    req.userId = userId;
    logger.debug(`User ${userId} authenticated for ${req.method} ${req.path}`, 'auth', userId);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    logger.warn('API_KEY not configured in environment variables', 'auth');
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    throw new AppError('Invalid API key', 401, 'auth');
  }

  next();
};
