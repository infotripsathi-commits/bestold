# 🚀 Error Recovery Quick Setup

## Instant Setup (Already Done!)

The error recovery system is **already integrated** and working automatically. No configuration needed!

---

## ✅ What's Already Working

### 1. Automatic Retry
All API calls automatically retry up to 3 times with exponential backoff.

### 2. Cache Fallback
When APIs fail, the system automatically uses cached data.

### 3. User-Friendly Errors
Technical errors are automatically translated to friendly messages.

### 4. Recovery Tracking
All recovery attempts are logged and visible in the dashboard.

---

## 📊 View Recovery Dashboard

**URL**: `/admin/recovery`

**Access**: Admin role required

**What You'll See**:
- Total recovery attempts
- Success rate
- Average recovery time
- Manual interventions needed
- Cache statistics
- Recent recovery history

---

## 🔧 Using in Your Code

### Basic Usage (Automatic)

```typescript
// Already works automatically for Supabase queries!
const { data, error } = await supabase
  .from('products')
  .select('*');
```

### Enhanced Usage (Manual)

```typescript
import { withRecovery } from '@/lib/errorRecovery';

// Wrap any async operation
const data = await withRecovery(
  async () => {
    return await fetchData();
  },
  'my_cache_key'
);
```

### Using API Wrapper

```typescript
import { fetchWithRecovery } from '@/lib/apiWrapper';

// Fetch with automatic recovery
const data = await fetchWithRecovery('/api/products');
```

---

## 🎯 Common Scenarios

### Scenario 1: Network Error

**What Happens**:
1. User loses internet connection
2. API call fails
3. System retries 3 times
4. Falls back to cached data
5. User sees data (with "cached" indicator)

**User Experience**: Seamless, no error shown

### Scenario 2: Server Error

**What Happens**:
1. Server returns 500 error
2. System retries 3 times
3. Falls back to cached data if available
4. If no cache, shows friendly error message
5. Admin gets notification

**User Experience**: Friendly error with retry button

### Scenario 3: Timeout

**What Happens**:
1. Request takes too long
2. System cancels and retries
3. Uses faster retry with shorter timeout
4. Falls back to cache if all retries fail

**User Experience**: Faster response or cached data

---

## 📈 Monitoring

### Check System Health

1. Go to `/admin/recovery`
2. View success rate (should be > 90%)
3. Check manual interventions (should be < 5%)
4. Review recent recovery attempts

### Alert Thresholds

- ✅ Success Rate > 90%: Healthy
- ⚠️ Success Rate 70-90%: Warning
- 🚨 Success Rate < 70%: Critical

---

## 🧪 Testing

### Test Retry Logic

1. Disconnect internet
2. Try to load a page
3. Reconnect internet
4. Page should load automatically

### Test Cache Fallback

1. Load a page (populates cache)
2. Disconnect internet
3. Refresh page
4. Should see cached data

### Test Error Messages

1. Go to non-existent page
2. Should see friendly "Page Not Found" message
3. Click "Go Home" button
4. Should navigate to homepage

---

## 🎨 Customizing Error Messages

### Add Custom Error Mapping

Edit `src/components/common/UserFriendlyError.tsx`:

```typescript
// Add your custom error pattern
if (errorMessage.includes('your_error')) {
  return {
    title: 'Your Custom Title',
    message: 'Your custom message',
    suggestion: 'What user should do',
    canRetry: true,
  };
}
```

---

## 📊 Recovery Statistics

### View in Dashboard

- **Total Recoveries**: All attempts
- **Success Rate**: % successful
- **Avg Time**: Time to recover
- **By Strategy**: Distribution

### Export Data

```typescript
import { errorRecoveryService } from '@/lib/errorRecovery';

// Get statistics
const stats = errorRecoveryService.getRecoveryStats();
console.log(stats);

// Get history
const history = errorRecoveryService.getRecoveryHistory();
console.log(history);
```

---

## 🔧 Advanced Configuration

### Adjust Retry Attempts

```typescript
await withRecovery(
  operation,
  cacheKey,
  {
    maxRetries: 5, // Default is 3
  }
);
```

### Adjust Cache TTL

```typescript
await withRecovery(
  operation,
  cacheKey,
  {
    cacheTTL: 10 * 60 * 1000, // 10 minutes (default is 5)
  }
);
```

### Disable Cache Fallback

```typescript
await withRecovery(
  operation,
  cacheKey,
  {
    enableCacheFallback: false, // For critical operations
  }
);
```

---

## 🐛 Troubleshooting

### Recovery Not Working

**Check**:
1. Is operation wrapped with `withRecovery`?
2. Is cache key unique?
3. Is error retryable?

**Fix**: Review Recovery Dashboard for details

### Too Many Retries

**Check**:
1. Is error actually recoverable?
2. Is server down?
3. Is network unstable?

**Fix**: Reduce `maxRetries` or fix underlying issue

### Cache Not Used

**Check**:
1. Is `enableCacheFallback` true?
2. Was data cached before?
3. Has cache expired?

**Fix**: Check cache statistics in dashboard

---

## 📚 Learn More

- **Full Guide**: [ERROR_RECOVERY.md](./ERROR_RECOVERY.md)
- **Monitoring**: [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
- **Dashboard**: `/admin/recovery`

---

## ✨ Benefits

### For Users
- ✅ Fewer errors
- ✅ Faster loading
- ✅ Better experience
- ✅ Seamless recovery

### For Developers
- ✅ Less debugging
- ✅ Automatic fixes
- ✅ Better insights
- ✅ Easier maintenance

### For Business
- ✅ Higher uptime
- ✅ Fewer complaints
- ✅ Better reputation
- ✅ Lower support costs

---

## 🎯 Success!

Your error recovery system is **live and working**!

**Next Steps**:
1. Monitor recovery dashboard
2. Review success rate
3. Optimize based on data
4. Enjoy fewer errors!

---

*Setup Time: 0 minutes (already done!)*
*Configuration: None required*
*Status: Active and monitoring*
