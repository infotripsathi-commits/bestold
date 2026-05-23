# 📊 Monitoring & Alerting System Documentation

## Overview

BESTOLD platform includes a comprehensive monitoring and alerting system that tracks:
- **Error Tracking** with Sentry
- **Performance Monitoring** with Core Web Vitals
- **Real-time Analytics** with Vercel Analytics
- **Structured Logging** for debugging
- **System Metrics** dashboard

---

## 🎯 Features Implemented

### 1. Error Tracking (Sentry)
- ✅ Automatic error capture and reporting
- ✅ Source maps for debugging
- ✅ Session replay for error reproduction
- ✅ User context tracking
- ✅ Breadcrumb trail for debugging
- ✅ Performance transaction tracking
- ✅ Error filtering and deduplication

### 2. Performance Monitoring
- ✅ Core Web Vitals tracking (LCP, FID, CLS)
- ✅ First Contentful Paint (FCP)
- ✅ Time to First Byte (TTFB)
- ✅ Page load time measurement
- ✅ Resource timing monitoring
- ✅ Slow operation detection

### 3. Analytics Integration
- ✅ Vercel Analytics for traffic monitoring
- ✅ Speed Insights for performance tracking
- ✅ Real-time visitor tracking
- ✅ Page view analytics
- ✅ User journey tracking

### 4. Structured Logging
- ✅ Multi-level logging (DEBUG, INFO, WARN, ERROR, CRITICAL)
- ✅ Context-aware logging
- ✅ User session tracking
- ✅ Local error log storage
- ✅ Performance measurement utilities
- ✅ API call monitoring

### 5. Monitoring Dashboard
- ✅ Real-time system metrics
- ✅ Active users count
- ✅ Error rate tracking
- ✅ Performance metrics display
- ✅ Recent error logs viewer
- ✅ System information panel

---

## 🚀 Setup Instructions

### Step 1: Configure Sentry

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Sign up for free account
   - Create a new project (React)

2. **Get DSN**
   - Copy your project DSN from Settings → Client Keys (DSN)
   - Example: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

3. **Add to Environment Variables**
   ```env
   VITE_SENTRY_DSN=your_sentry_dsn_here
   VITE_APP_VERSION=1.0.0
   ```

4. **Deploy with Environment Variables**
   - **Vercel**: Settings → Environment Variables
   - **Netlify**: Site settings → Environment variables
   - Add both variables to your hosting platform

### Step 2: Enable Vercel Analytics

1. **Vercel Dashboard**
   - Go to your project in Vercel
   - Click "Analytics" tab
   - Click "Enable Analytics"

2. **No Configuration Needed**
   - Analytics component is already integrated
   - Data will start appearing automatically

### Step 3: Configure Source Maps (Optional)

For better error debugging with Sentry:

1. **Install Sentry CLI**
   ```bash
   npm install --save-dev @sentry/vite-plugin
   ```

2. **Update vite.config.ts**
   ```typescript
   import { sentryVitePlugin } from "@sentry/vite-plugin";
   
   export default defineConfig({
     plugins: [
       react(),
       sentryVitePlugin({
         org: "your-org",
         project: "your-project",
         authToken: process.env.SENTRY_AUTH_TOKEN,
       }),
     ],
   });
   ```

3. **Add to .env**
   ```env
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   ```

---

## 📈 Using the Monitoring Dashboard

### Access the Dashboard

**URL**: `/admin/monitoring`

**Requirements**: Admin role required

### Dashboard Sections

#### 1. System Overview
- **Active Users**: Users active in last 5 minutes
- **Error Rate**: Percentage of requests with errors
- **Uptime**: System availability percentage
- **Total Requests**: Number of logged requests

#### 2. Performance Tab
- **Core Web Vitals**: LCP, FID, CLS metrics
- **Loading Performance**: FCP, TTFB
- **Status Indicators**: Good, Needs Improvement, Poor
- **Threshold Alerts**: Automatic warnings for poor performance

#### 3. Errors Tab
- **Recent Errors**: Last 10 error logs
- **Error Details**: Timestamp, level, message, context
- **Clear Logs**: Button to clear local error logs
- **Error Status**: Visual indicator when no errors

#### 4. Database Tab
- **Link to Supabase Dashboard**
- **Database Performance Metrics**
- **Query Analysis Tools**

#### 5. System Tab
- **Environment Information**
- **User Agent Details**
- **Screen Resolution**
- **Network Connection Type**

---

## 🔍 Logging Best Practices

### Using the Logger

```typescript
import { logger } from '@/lib/logger';

// Debug information
logger.debug('User clicked button', { buttonId: 'submit' });

// General information
logger.info('User logged in', { userId: user.id });

// Warnings
logger.warn('API response slow', { duration: 3000 });

// Errors
logger.error('Failed to load data', error, { endpoint: '/api/products' });

// Critical errors
logger.critical('Database connection lost', error);
```

### Setting User Context

```typescript
import { logger } from '@/lib/logger';

// When user logs in
logger.setUserId(user.id);
logger.setContext({ role: user.role, email: user.email });

// When user logs out
logger.clearUserId();
logger.clearContext();
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/logger';

// Measure synchronous operation
performanceMonitor.startMeasure('data-processing');
// ... do work ...
performanceMonitor.endMeasure('data-processing');

// Measure async operation
const result = await performanceMonitor.measureAsync(
  'api-call',
  async () => {
    return await fetchData();
  }
);
```

### API Call Logging

```typescript
import { logApiCall } from '@/lib/logger';

const startTime = performance.now();
try {
  const response = await fetch('/api/products');
  const duration = performance.now() - startTime;
  logApiCall('GET', '/api/products', response.status, duration);
} catch (error) {
  const duration = performance.now() - startTime;
  logApiCall('GET', '/api/products', 0, duration, error);
}
```

---

## 🚨 Alert Configuration

### Automatic Alerts

The system automatically logs warnings for:

1. **Slow Operations** (> 3 seconds)
   ```
   WARN: Slow operation detected: data-processing (3245.67ms)
   ```

2. **Slow API Calls** (> 2 seconds)
   ```
   WARN: Slow API call: GET /api/products (2156.43ms)
   ```

3. **Poor Performance Metrics**
   - LCP > 4000ms
   - FID > 300ms
   - CLS > 0.25

4. **API Errors** (Status >= 400)
   ```
   WARN: API call returned error: GET /api/products
   ```

### Custom Alerts

Set up custom alerts in Sentry:

1. **Go to Sentry Dashboard**
2. **Alerts → Create Alert Rule**
3. **Configure Conditions**:
   - Error rate > 5%
   - Response time > 2000ms
   - Specific error types

4. **Set Notification Channels**:
   - Email
   - Slack
   - PagerDuty
   - Webhooks

---

## 📊 Metrics Collected

### Performance Metrics

| Metric | Description | Good | Needs Improvement | Poor |
|--------|-------------|------|-------------------|------|
| LCP | Largest Contentful Paint | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| FID | First Input Delay | ≤ 100ms | ≤ 300ms | > 300ms |
| CLS | Cumulative Layout Shift | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | First Contentful Paint | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB | Time to First Byte | ≤ 800ms | ≤ 1.8s | > 1.8s |

### System Metrics

- **Active Users**: Real-time user count
- **Error Rate**: Percentage of failed requests
- **Uptime**: System availability
- **Response Time**: Average API response time
- **Request Volume**: Total requests per period

### User Metrics

- **Page Views**: Total page views
- **Unique Visitors**: Unique user count
- **Session Duration**: Average session length
- **Bounce Rate**: Single-page sessions
- **Conversion Rate**: Goal completions

---

## 🔧 Troubleshooting

### Sentry Not Capturing Errors

**Problem**: Errors not appearing in Sentry dashboard

**Solutions**:
1. Check VITE_SENTRY_DSN is set correctly
2. Verify environment is production (`import.meta.env.PROD`)
3. Check browser console for Sentry initialization errors
4. Verify network requests to Sentry are not blocked

### Performance Metrics Not Showing

**Problem**: Core Web Vitals not displaying

**Solutions**:
1. Wait 30-60 seconds after page load
2. Refresh the monitoring dashboard
3. Check browser supports Performance Observer API
4. Verify page has sufficient content for LCP

### Analytics Not Tracking

**Problem**: Vercel Analytics showing no data

**Solutions**:
1. Verify Analytics is enabled in Vercel dashboard
2. Check deployment is on Vercel (not local)
3. Wait 5-10 minutes for data to appear
4. Verify `<Analytics />` component is rendered

### High Error Rate

**Problem**: Error rate > 5%

**Actions**:
1. Check Errors tab in monitoring dashboard
2. Review recent error logs
3. Check Sentry dashboard for error details
4. Investigate common error patterns
5. Deploy hotfix if critical

---

## 📱 Mobile Monitoring

### Mobile-Specific Metrics

The system tracks mobile-specific data:
- Device type (phone, tablet, desktop)
- Screen resolution
- Network connection type (4G, 5G, WiFi)
- Touch interactions
- Mobile-specific errors

### Mobile Performance

Mobile devices have different thresholds:
- Slower network connections
- Less processing power
- Battery constraints

Monitor mobile performance separately in Vercel Analytics.

---

## 🔐 Security & Privacy

### Data Collection

**What We Collect**:
- Error messages and stack traces
- Performance metrics
- Page views and navigation
- User actions (anonymized)
- System information

**What We DON'T Collect**:
- Passwords or sensitive data
- Personal information (unless in error context)
- Payment details
- Private messages

### GDPR Compliance

- User data is anonymized
- Session replay masks sensitive text
- Users can opt-out of analytics
- Data retention policies configured

### Data Retention

- **Sentry**: 90 days (configurable)
- **Vercel Analytics**: 30 days (free tier)
- **Local Logs**: Last 50 errors only

---

## 📈 Performance Optimization

### Based on Monitoring Data

1. **Identify Slow Pages**
   - Check LCP metrics per page
   - Optimize images on slow pages
   - Implement code splitting

2. **Reduce Error Rate**
   - Fix most common errors first
   - Add error boundaries
   - Improve error handling

3. **Improve Response Times**
   - Optimize database queries
   - Add caching layers
   - Use CDN for static assets

4. **Enhance User Experience**
   - Reduce CLS with proper sizing
   - Improve FID with code optimization
   - Optimize critical rendering path

---

## 🎯 Key Performance Indicators (KPIs)

### Target Metrics

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Error Rate | < 1% | Monitor | 🟢 |
| LCP | < 2.5s | Monitor | 🟢 |
| FID | < 100ms | Monitor | 🟢 |
| CLS | < 0.1 | Monitor | 🟢 |
| Uptime | > 99.9% | Monitor | 🟢 |
| Response Time | < 500ms | Monitor | 🟢 |

### Monthly Review

Review these metrics monthly:
1. Error trends
2. Performance improvements
3. User growth
4. System stability
5. Alert frequency

---

## 🆘 Support & Resources

### Documentation

- **Sentry Docs**: https://docs.sentry.io
- **Vercel Analytics**: https://vercel.com/docs/analytics
- **Web Vitals**: https://web.dev/vitals

### Monitoring Dashboard

- **URL**: `/admin/monitoring`
- **Access**: Admin role required
- **Refresh**: Every 30 seconds

### Getting Help

1. Check error logs in monitoring dashboard
2. Review Sentry dashboard for details
3. Check Supabase logs for database issues
4. Review Vercel deployment logs

---

## 🔄 Continuous Improvement

### Regular Tasks

**Daily**:
- Check error rate
- Review critical errors
- Monitor performance metrics

**Weekly**:
- Analyze error trends
- Review performance improvements
- Check alert frequency

**Monthly**:
- Performance audit
- Error pattern analysis
- Optimization planning
- KPI review

---

*Last Updated: 2026-03-24*
*Version: 1.0.0*
