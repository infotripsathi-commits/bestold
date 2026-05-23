# 🚀 Quick Monitoring Setup Guide

## 5-Minute Setup

### Step 1: Create Sentry Account (2 minutes)

1. Go to https://sentry.io/signup/
2. Sign up with GitHub or email
3. Create new project:
   - Platform: **React**
   - Project name: **bestold**
4. Copy your DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Step 2: Add Environment Variables (1 minute)

**For Vercel**:
1. Go to your project → Settings → Environment Variables
2. Add these variables:
   ```
   VITE_SENTRY_DSN = your_sentry_dsn_here
   VITE_APP_VERSION = 1.0.0
   ```
3. Redeploy your application

**For Netlify**:
1. Go to Site settings → Environment variables
2. Add the same variables
3. Trigger new deploy

**For Local Development**:
Add to your `.env` file:
```env
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_APP_VERSION=1.0.0
```

### Step 3: Enable Vercel Analytics (1 minute)

1. Go to your Vercel project
2. Click "Analytics" tab
3. Click "Enable Analytics"
4. Done! (Already integrated in code)

### Step 4: Access Monitoring Dashboard (1 minute)

1. Deploy your application
2. Login as admin
3. Go to: `/admin/monitoring`
4. View real-time metrics!

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Visit your deployed site
- [ ] Check browser console for Sentry initialization
- [ ] Trigger a test error (optional)
- [ ] Check Sentry dashboard for the error
- [ ] Visit `/admin/monitoring` page
- [ ] See performance metrics loading
- [ ] Check Vercel Analytics dashboard

---

## 🎯 What You Get

### Automatic Monitoring

✅ **Error Tracking**
- All JavaScript errors captured
- Stack traces with source maps
- User context and breadcrumbs
- Session replay for debugging

✅ **Performance Monitoring**
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- API response times
- Slow operation detection

✅ **Analytics**
- Real-time visitor tracking
- Page view analytics
- User journey tracking
- Traffic sources

✅ **Logging**
- Structured error logs
- Performance measurements
- API call monitoring
- User action tracking

---

## 📊 Monitoring Dashboard Features

### System Overview
- Active users count
- Error rate percentage
- System uptime
- Total requests

### Performance Tab
- Core Web Vitals metrics
- Performance status indicators
- Threshold warnings
- Optimization suggestions

### Errors Tab
- Recent error logs (last 10)
- Error details and context
- Timestamp and severity
- Clear logs button

### Database Tab
- Link to Supabase dashboard
- Database performance metrics
- Query analysis tools

### System Tab
- Environment information
- Browser details
- Screen resolution
- Network connection

---

## 🔔 Alert Configuration

### Sentry Alerts (Recommended)

1. **Go to Sentry Dashboard**
2. **Alerts → Create Alert Rule**
3. **Recommended Rules**:

   **High Error Rate**:
   - Condition: Error count > 10 in 1 hour
   - Action: Send email notification

   **Performance Degradation**:
   - Condition: Transaction duration > 2000ms
   - Action: Send Slack notification

   **Critical Errors**:
   - Condition: Error level = critical
   - Action: Send immediate notification

4. **Save and Test**

---

## 🐛 Testing Your Setup

### Test Error Tracking

Add this to any page temporarily:

```typescript
// Test error capture
throw new Error('Test error for Sentry');
```

Check Sentry dashboard - you should see the error within seconds.

### Test Performance Monitoring

1. Visit your site
2. Wait 30 seconds
3. Go to `/admin/monitoring`
4. Check Performance tab
5. Should see Core Web Vitals metrics

### Test Analytics

1. Visit several pages on your site
2. Wait 5-10 minutes
3. Check Vercel Analytics dashboard
4. Should see page views and visitors

---

## 💡 Pro Tips

### 1. Set Up Slack Notifications

Connect Sentry to Slack for instant error alerts:
1. Sentry → Settings → Integrations
2. Add Slack integration
3. Choose channel for alerts
4. Configure alert rules

### 2. Create Custom Dashboards

In Sentry:
1. Discover → Build Query
2. Filter by error type, user, page
3. Save as dashboard
4. Share with team

### 3. Monitor Key Pages

Track specific pages:
```typescript
import { logPageView } from '@/lib/logger';

useEffect(() => {
  logPageView(window.location.pathname);
}, []);
```

### 4. Track User Actions

Log important user actions:
```typescript
import { logUserAction } from '@/lib/logger';

const handlePurchase = () => {
  logUserAction('purchase_completed', {
    productId: product.id,
    amount: product.price,
  });
};
```

---

## 📈 Monitoring Best Practices

### Daily Tasks
- [ ] Check error rate in dashboard
- [ ] Review critical errors in Sentry
- [ ] Monitor performance metrics

### Weekly Tasks
- [ ] Analyze error trends
- [ ] Review slow pages
- [ ] Check alert frequency
- [ ] Update alert rules if needed

### Monthly Tasks
- [ ] Performance audit
- [ ] Error pattern analysis
- [ ] Optimization planning
- [ ] Team review meeting

---

## 🆘 Troubleshooting

### Sentry Not Working

**Problem**: No errors showing in Sentry

**Solutions**:
1. Check `VITE_SENTRY_DSN` is set correctly
2. Verify you're in production mode
3. Check browser console for Sentry errors
4. Test with a manual error: `throw new Error('test')`

### Performance Metrics Missing

**Problem**: No Core Web Vitals data

**Solutions**:
1. Wait 30-60 seconds after page load
2. Refresh monitoring dashboard
3. Check browser supports Performance API
4. Try in different browser

### Analytics Not Tracking

**Problem**: No data in Vercel Analytics

**Solutions**:
1. Verify deployment is on Vercel
2. Check Analytics is enabled
3. Wait 5-10 minutes for data
4. Clear browser cache and revisit

---

## 📚 Additional Resources

### Documentation
- **Full Guide**: [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
- **Sentry Docs**: https://docs.sentry.io
- **Vercel Analytics**: https://vercel.com/docs/analytics
- **Web Vitals**: https://web.dev/vitals

### Dashboards
- **Monitoring**: `/admin/monitoring`
- **Sentry**: https://sentry.io/organizations/your-org/
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard

---

## ✨ You're All Set!

Your BESTOLD platform now has enterprise-grade monitoring!

**What's Monitored**:
- ✅ All errors and exceptions
- ✅ Performance metrics
- ✅ User analytics
- ✅ System health
- ✅ API performance

**Next Steps**:
1. Monitor for a few days
2. Set up custom alerts
3. Optimize based on data
4. Share dashboard with team

---

*Setup Time: ~5 minutes*
*Cost: Free tier available for all services*
*Support: See MONITORING_GUIDE.md for detailed help*
