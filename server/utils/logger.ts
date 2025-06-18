import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  userId?: number;
  error?: any;
  metadata?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL 
      ? parseInt(process.env.LOG_LEVEL) 
      : LogLevel.INFO;
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeToFile(filename: string, entry: LogEntry) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, this.formatLog(entry));
  }

  private log(level: LogLevel, levelName: string, message: string, module?: string, userId?: number, error?: any, metadata?: any) {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      module,
      userId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    };

    // Console output
    console.log(`[${entry.timestamp}] ${levelName}: ${message}${module ? ` (${module})` : ''}`);
    if (error) console.error(error);

    // File output
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`app-${today}.log`, entry);

    if (level === LogLevel.ERROR) {
      this.writeToFile(`errors-${today}.log`, entry);
    }
  }

  error(message: string, module?: string, userId?: number, error?: any, metadata?: any) {
    this.log(LogLevel.ERROR, 'ERROR', message, module, userId, error, metadata);
  }

  warn(message: string, module?: string, userId?: number, metadata?: any) {
    this.log(LogLevel.WARN, 'WARN', message, module, userId, undefined, metadata);
  }

  info(message: string, module?: string, userId?: number, metadata?: any) {
    this.log(LogLevel.INFO, 'INFO', message, module, userId, undefined, metadata);
  }

  debug(message: string, module?: string, userId?: number, metadata?: any) {
    if (LogLevel.DEBUG > this.logLevel && process.env.NODE_ENV === 'production') return;
    this.log(LogLevel.DEBUG, 'DEBUG', message, module, userId, undefined, metadata);
  }
}

export const logger = new Logger();