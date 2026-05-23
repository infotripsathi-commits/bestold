// Performance monitoring and metrics collection

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
}

export interface MetricThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

// Web Vitals thresholds (Google's recommendations)
export const METRIC_THRESHOLDS: MetricThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

class PerformanceTracker {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  init() {
    if (typeof window === 'undefined') return;

    this.observeWebVitals();
    this.observeNavigationTiming();
    this.observeResourceTiming();
  }

  private observeWebVitals() {
    // Observe Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.reportMetric('lcp', this.metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observation not supported');
    }

    // Observe First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          this.metrics.fid = fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0;
          this.reportMetric('fid', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observation not supported');
    }

    // Observe Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value || 0;
            this.metrics.cls = clsValue;
          }
        });
        if (this.metrics.cls !== undefined) {
          this.reportMetric('cls', this.metrics.cls);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observation not supported');
    }

    // Observe First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.reportMetric('fcp', this.metrics.fcp);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP observation not supported');
    }
  }

  private observeNavigationTiming() {
    if (!('PerformanceNavigationTiming' in window)) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
          this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          
          this.reportMetric('ttfb', this.metrics.ttfb);
          this.reportMetric('pageLoadTime', this.metrics.pageLoadTime);
        }
      }, 0);
    });
  }

  private observeResourceTiming() {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resource = entry as PerformanceResourceTiming;
          
          // Track slow resources
          const duration = resource.duration || 0;
          if (duration > 1000) {
            console.warn(`Slow resource: ${resource.name} (${duration.toFixed(2)}ms)`);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource timing observation not supported');
    }
  }

  private reportMetric(name: string, value: number) {
    // Check against thresholds
    const threshold = METRIC_THRESHOLDS[name as keyof MetricThresholds];
    let status = 'good';
    
    if (threshold) {
      if (value > threshold.needsImprovement) {
        status = 'poor';
      } else if (value > threshold.good) {
        status = 'needs-improvement';
      }
    }

    console.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${status})`);

    // Send to analytics
    if (import.meta.env.PROD) {
      this.sendToAnalytics(name, value, status);
    }
  }

  private sendToAnalytics(name: string, value: number, status: string) {
    // Send to your analytics service
    try {
      // Example: Send to custom endpoint
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value,
          status,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }).catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

export const performanceTracker = new PerformanceTracker();

// Initialize performance tracking
export function initPerformanceTracking() {
  performanceTracker.init();
}

// Get current performance metrics
export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceTracker.getMetrics();
}
