// Structured logging utility for better debugging and monitoring

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private sessionId: string;
  private userId?: string;
  private context: Record<string, any> = {};

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  clearUserId() {
    this.userId = undefined;
  }

  setContext(context: Record<string, any>) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    additionalContext?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private log(entry: LogEntry) {
    // Console output with color coding
    const colors = {
      [LogLevel.DEBUG]: '#6B7280',
      [LogLevel.INFO]: '#3B82F6',
      [LogLevel.WARN]: '#F59E0B',
      [LogLevel.ERROR]: '#EF4444',
      [LogLevel.CRITICAL]: '#DC2626',
    };

    const color = colors[entry.level];
    
    console.log(
      `%c[${entry.level.toUpperCase()}] ${entry.timestamp}`,
      `color: ${color}; font-weight: bold;`,
      entry.message,
      entry.context
    );

    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoring(entry);
    }

    // Store critical errors locally for debugging
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
      this.storeErrorLocally(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Send to monitoring endpoint (implement based on your monitoring service)
    try {
      // Example: Send to custom monitoring endpoint
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silently fail to avoid infinite loops
      });
    } catch {
      // Silently fail
    }
  }

  private storeErrorLocally(entry: LogEntry) {
    try {
      const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      errors.push(entry);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift();
      }
      
      localStorage.setItem('error_logs', JSON.stringify(errors));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log(this.createLogEntry(LogLevel.ERROR, message, errorContext));
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log(this.createLogEntry(LogLevel.CRITICAL, message, errorContext));
  }

  // Get stored error logs
  getErrorLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored error logs
  clearErrorLogs() {
    localStorage.removeItem('error_logs');
  }
}

// Export singleton instance
export const logger = new Logger();

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  startMeasure(name: string) {
    this.metrics.set(name, performance.now());
  }

  endMeasure(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      logger.warn(`Performance measure "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });

    // Alert if operation is slow
    if (duration > 3000) {
      logger.warn(`Slow operation detected: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    }

    return duration;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// API call monitoring
export function logApiCall(
  method: string,
  url: string,
  status: number,
  duration: number,
  error?: Error
) {
  const context = {
    method,
    url,
    status,
    duration: `${duration.toFixed(2)}ms`,
  };

  if (error) {
    logger.error(`API call failed: ${method} ${url}`, error, context);
  } else if (status >= 400) {
    logger.warn(`API call returned error: ${method} ${url}`, context);
  } else if (duration > 2000) {
    logger.warn(`Slow API call: ${method} ${url}`, context);
  } else {
    logger.debug(`API call: ${method} ${url}`, context);
  }
}

// User action tracking
export function logUserAction(action: string, details?: Record<string, any>) {
  logger.info(`User action: ${action}`, details);
}

// Page view tracking
export function logPageView(path: string) {
  logger.info(`Page view: ${path}`, {
    referrer: document.referrer,
    title: document.title,
  });
}
