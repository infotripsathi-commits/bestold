// Enhanced API wrapper with automatic error recovery

import { withRecovery } from './errorRecovery';
import { logger, logApiCall } from './logger';
import { supabase } from '@/db/supabase';

export interface ApiOptions {
  enableRecovery?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<ApiOptions> = {
  enableRecovery: true,
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  timeout: 30000, // 30 seconds
};

// Enhanced fetch with recovery
export async function fetchWithRecovery<T>(
  url: string,
  options: RequestInit & ApiOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cacheKey = `api_${url}_${JSON.stringify(options.body || {})}`;
  const startTime = performance.now();
  
  const operation = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      
      const data = await response.json();
      const duration = performance.now() - startTime;
      
      logApiCall('fetch', url, response.status, duration);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;
      logApiCall('fetch', url, 0, duration, error as Error);
      throw error;
    }
  };
  
  if (opts.enableRecovery) {
    return withRecovery(operation, cacheKey, {
      enableRetry: true,
      enableCacheFallback: opts.enableCache,
      maxRetries: opts.maxRetries,
      cacheTTL: opts.cacheTTL,
    });
  }
  
  return operation();
}

// Enhanced Supabase query with recovery
export async function queryWithRecovery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  options: ApiOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();
  
  const operation = async () => {
    const { data, error } = await queryFn();
    const duration = performance.now() - startTime;
    
    if (error) {
      logApiCall('supabase', cacheKey, 500, duration, error);
      throw error;
    }
    
    logApiCall('supabase', cacheKey, 200, duration);
    return data as T;
  };
  
  if (opts.enableRecovery) {
    return withRecovery(operation, cacheKey, {
      enableRetry: true,
      enableCacheFallback: opts.enableCache,
      maxRetries: opts.maxRetries,
      cacheTTL: opts.cacheTTL,
    });
  }
  
  return operation();
}

// Batch operations with recovery
export async function batchWithRecovery<T>(
  operations: Array<() => Promise<T>>,
  options: ApiOptions = {}
): Promise<T[]> {
  const results: T[] = [];
  const errors: Error[] = [];
  
  for (const operation of operations) {
    try {
      const result = await withRecovery(
        operation,
        `batch_${Date.now()}_${Math.random()}`,
        {
          enableRetry: options.enableRecovery !== false,
          maxRetries: options.maxRetries || 3,
        }
      );
      results.push(result);
    } catch (error) {
      errors.push(error as Error);
      logger.error('Batch operation failed', error as Error);
    }
  }
  
  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All batch operations failed: ${errors.length} errors`);
  }
  
  return results;
}

// Parallel operations with recovery
export async function parallelWithRecovery<T>(
  operations: Array<() => Promise<T>>,
  options: ApiOptions = {}
): Promise<T[]> {
  const promises = operations.map((operation, index) =>
    withRecovery(operation, `parallel_${index}_${Date.now()}`, {
      enableRetry: options.enableRecovery !== false,
      maxRetries: options.maxRetries || 3,
    }).catch((error) => {
      logger.error(`Parallel operation ${index} failed`, error);
      return null;
    })
  );
  
  const results = await Promise.all(promises);
  return results.filter((r) => r !== null) as T[];
}

// Optimistic update with rollback
export async function optimisticUpdate<T>(
  updateFn: () => Promise<T>,
  rollbackFn: () => void,
  cacheKey: string
): Promise<T> {
  try {
    return await withRecovery(updateFn, cacheKey, {
      enableRetry: true,
      maxRetries: 3,
    });
  } catch (error) {
    logger.warn('Optimistic update failed, rolling back', { cacheKey });
    rollbackFn();
    throw error;
  }
}

// Polling with recovery
export async function pollWithRecovery<T>(
  pollFn: () => Promise<T>,
  condition: (data: T) => boolean,
  options: {
    interval?: number;
    maxAttempts?: number;
    timeout?: number;
  } = {}
): Promise<T> {
  const interval = options.interval || 1000;
  const maxAttempts = options.maxAttempts || 30;
  const timeout = options.timeout || 30000;
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Polling timeout exceeded');
    }
    
    try {
      const data = await withRecovery(
        pollFn,
        `poll_${attempts}_${Date.now()}`,
        {
          enableRetry: true,
          maxRetries: 2,
        }
      );
      
      if (condition(data)) {
        return data;
      }
    } catch (error) {
      logger.warn(`Polling attempt ${attempts + 1} failed`, { error });
    }
    
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  
  throw new Error('Polling max attempts exceeded');
}
