import * as Sentry from '@sentry/react';

// Initialize Sentry for error tracking
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Replay integration for session recording
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in dev
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'development',
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      const error = hint.originalException;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        
        // Ignore network errors that are expected
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
          return null;
        }
        
        // Ignore cancelled requests
        if (message.includes('AbortError') || message.includes('cancelled')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        app: 'bestold',
        platform: 'web',
      },
    },
  });
}

// Custom error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Capture custom errors
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Capture custom messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Set user context
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({
    name,
    op,
  }, (span) => span);
}

// Measure function performance
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name,
      op: 'function',
    },
    async () => {
      return await fn();
    }
  );
}
