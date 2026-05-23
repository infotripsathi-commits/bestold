// Error recovery service with automatic healing mechanisms

import { retryWithBackoff, isRetryableError, CircuitBreaker } from './retry';
import { cacheManager } from './cache';
import { logger } from './logger';
import { captureError } from './sentry';

export enum RecoveryStrategy {
  RETRY = 'retry',
  CACHE_FALLBACK = 'cache_fallback',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  MANUAL_INTERVENTION = 'manual_intervention',
}

export interface RecoveryAttempt {
  id: string;
  timestamp: Date;
  error: Error;
  strategy: RecoveryStrategy;
  success: boolean;
  attempts: number;
  duration: number;
  context?: Record<string, any>;
}

export interface ErrorRecoveryOptions {
  enableRetry?: boolean;
  enableCacheFallback?: boolean;
  enableGracefulDegradation?: boolean;
  maxRetries?: number;
  cacheTTL?: number;
  onRecovery?: (attempt: RecoveryAttempt) => void;
}

class ErrorRecoveryService {
  private recoveryHistory: RecoveryAttempt[] = [];
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly MAX_HISTORY = 100;
  
  // Attempt to recover from error
  async recover<T>(
    operation: () => Promise<T>,
    cacheKey: string,
    options: ErrorRecoveryOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const attemptId = this.generateAttemptId();
    let lastError: Error;
    let attempts = 0;
    
    const opts = {
      enableRetry: true,
      enableCacheFallback: true,
      enableGracefulDegradation: false,
      maxRetries: 3,
      cacheTTL: 5 * 60 * 1000,
      ...options,
    };
    
    // Strategy 1: Retry with exponential backoff
    if (opts.enableRetry) {
      try {
        attempts++;
        const result = await retryWithBackoff(operation, {
          maxAttempts: opts.maxRetries,
          onRetry: (error, attempt, delay) => {
            logger.warn(`Retry attempt ${attempt} after ${delay}ms`, {
              error: error.message,
              cacheKey,
            });
          },
        });
        
        // Cache successful result
        cacheManager.set(cacheKey, result, { ttl: opts.cacheTTL });
        
        // Record successful recovery
        this.recordRecovery({
          id: attemptId,
          timestamp: new Date(),
          error: new Error('Recovered via retry'),
          strategy: RecoveryStrategy.RETRY,
          success: true,
          attempts,
          duration: Date.now() - startTime,
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.error('Retry strategy failed', lastError, { cacheKey });
      }
    }
    
    // Strategy 2: Fallback to cached data
    if (opts.enableCacheFallback) {
      const cached = cacheManager.get<T>(cacheKey);
      if (cached !== null) {
        logger.info('Using cached data as fallback', { cacheKey });
        
        this.recordRecovery({
          id: attemptId,
          timestamp: new Date(),
          error: lastError!,
          strategy: RecoveryStrategy.CACHE_FALLBACK,
          success: true,
          attempts,
          duration: Date.now() - startTime,
        });
        
        return cached;
      }
    }
    
    // Strategy 3: Graceful degradation
    if (opts.enableGracefulDegradation) {
      logger.warn('Graceful degradation activated', { cacheKey });
      
      this.recordRecovery({
        id: attemptId,
        timestamp: new Date(),
        error: lastError!,
        strategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
        success: true,
        attempts,
        duration: Date.now() - startTime,
        context: { degraded: true },
      });
      
      // Return empty/default data based on type
      return this.getDefaultValue<T>();
    }
    
    // All strategies failed - record and report
    this.recordRecovery({
      id: attemptId,
      timestamp: new Date(),
      error: lastError!,
      strategy: RecoveryStrategy.MANUAL_INTERVENTION,
      success: false,
      attempts,
      duration: Date.now() - startTime,
    });
    
    // Report to admins
    this.reportToAdmins(lastError!, cacheKey);
    
    throw lastError!;
  }
  
  // Get circuit breaker for a specific operation
  getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker());
    }
    return this.circuitBreakers.get(key)!;
  }
  
  // Execute with circuit breaker
  async executeWithCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(key);
    return breaker.execute(operation);
  }
  
  // Record recovery attempt
  private recordRecovery(attempt: RecoveryAttempt): void {
    this.recoveryHistory.unshift(attempt);
    
    // Keep only last MAX_HISTORY attempts
    if (this.recoveryHistory.length > this.MAX_HISTORY) {
      this.recoveryHistory = this.recoveryHistory.slice(0, this.MAX_HISTORY);
    }
    
    // Store in localStorage
    try {
      localStorage.setItem(
        'recovery_history',
        JSON.stringify(this.recoveryHistory.slice(0, 50))
      );
    } catch (error) {
      console.warn('Failed to store recovery history:', error);
    }
    
    // Log recovery attempt
    if (attempt.success) {
      logger.info(`Recovery successful: ${attempt.strategy}`, {
        attempts: attempt.attempts,
        duration: attempt.duration,
      });
    } else {
      logger.error(`Recovery failed: ${attempt.strategy}`, attempt.error, {
        attempts: attempt.attempts,
        duration: attempt.duration,
      });
    }
  }
  
  // Report critical failures to admins
  private reportToAdmins(error: Error, context: string): void {
    // Capture in Sentry
    captureError(error, {
      context,
      severity: 'critical',
      requiresManualIntervention: true,
    });
    
    // Log critical error
    logger.critical('Manual intervention required', error, { context });
    
    // Could also send email/Slack notification here
  }
  
  // Get default value based on type
  private getDefaultValue<T>(): T {
    return [] as T; // Return empty array as default
  }
  
  // Generate unique attempt ID
  private generateAttemptId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  // Get recovery history
  getRecoveryHistory(): RecoveryAttempt[] {
    return [...this.recoveryHistory];
  }
  
  // Get recovery statistics
  getRecoveryStats() {
    const total = this.recoveryHistory.length;
    const successful = this.recoveryHistory.filter((a) => a.success).length;
    const failed = total - successful;
    
    const byStrategy = this.recoveryHistory.reduce(
      (acc, attempt) => {
        acc[attempt.strategy] = (acc[attempt.strategy] || 0) + 1;
        return acc;
      },
      {} as Record<RecoveryStrategy, number>
    );
    
    const avgDuration =
      this.recoveryHistory.reduce((sum, a) => sum + a.duration, 0) / total || 0;
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byStrategy,
      avgDuration,
    };
  }
  
  // Clear recovery history
  clearHistory(): void {
    this.recoveryHistory = [];
    try {
      localStorage.removeItem('recovery_history');
    } catch (error) {
      console.warn('Failed to clear recovery history:', error);
    }
  }
  
  // Load recovery history from localStorage
  loadHistory(): void {
    try {
      const stored = localStorage.getItem('recovery_history');
      if (stored) {
        this.recoveryHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load recovery history:', error);
    }
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService();

// Initialize on load
if (typeof window !== 'undefined') {
  errorRecoveryService.loadHistory();
}

// Wrapper function for easy use
export async function withRecovery<T>(
  operation: () => Promise<T>,
  cacheKey: string,
  options?: ErrorRecoveryOptions
): Promise<T> {
  return errorRecoveryService.recover(operation, cacheKey, options);
}
