import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public module?: string;
  public code?: string;
  public source?: string;

  constructor(message: string, statusCode: number = 500, module?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.module = module;
    this.source = module;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = err instanceof AppError ? err : new AppError(err.message, 500, 'server');

  // Log error with context
  logger.error(
    `${error.message}${error.code ? ` (${error.code})` : ''}`,
    error.source || 'error-handler',
    undefined,
    { 
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    }
  );

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' && error.statusCode >= 500 
    ? 'Internal server error' 
    : error.message;

  res.status(error.statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error 
      })
    }
  });
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};