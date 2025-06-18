
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public module?: string;

  constructor(message: string, statusCode: number = 500, module?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.module = module;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let module = 'unknown';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    module = error.module || 'unknown';
  }

  // Log the error
  logger.error(
    `${req.method} ${req.path} - ${message}`,
    module,
    undefined,
    error,
    {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    }
  );

  // Don't expose stack traces in production
  const response: any = {
    success: false,
    message,
    statusCode
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
