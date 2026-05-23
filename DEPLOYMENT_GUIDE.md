# BESTOLD - Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free at https://vercel.com)
- Your code pushed to a Git repository

---

## Step 1: Prepare Your Repository

### 1.1 Create .gitignore (if not exists)
```bash
# Add these lines to .gitignore
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
```

### 1.2 Push Your Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit - BESTOLD platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bestold.git
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with your GitHub account
3. **Click "Add New Project"**
4. **Import your repository**:
   - Select your BESTOLD repository
   - Click "Import"

5. **Configure Project**:
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build:prod
   Output Directory: dist
   Install Command: npm install
   ```

6. **Add Environment Variables**:
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL = https://oczzuposrpzttcffohvv.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jenp1cG9zcnB6dHRjZmZvaHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzIwMzcsImV4cCI6MjA4OTk0ODAzN30.Q5kuTiQcqeC8HGO8xn2wE8Ts0m3zY0LJx_PkgYILI1M
   VITE_APP_ID = app-ahn8efyun8ch
   ```

7. **Click "Deploy"**
   - Wait 2-3 minutes for deployment
   - Your site will be live at: `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? bestold
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Step 3: Configure Custom Domain (Optional)

### 3.1 Add Domain in Vercel
1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `bestold.com`)

### 3.2 Update DNS Records
Add these records in your domain registrar:

**For root domain (bestold.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3.3 Wait for DNS Propagation
- Usually takes 5-60 minutes
- Vercel will automatically provision SSL certificate

---

## Step 4: Verify Deployment

### 4.1 Check Your Site
Visit your deployment URL and verify:
- ✅ Homepage loads correctly
- ✅ Products display properly
- ✅ Search functionality works
- ✅ User authentication works
- ✅ Images load from Supabase Storage
- ✅ Chat system functions
- ✅ Store pages accessible

### 4.2 Test Key Features
1. **Sign up/Login** - Create a test account
2. **Browse Products** - Check product listings
3. **Search** - Try searching for products
4. **Create Store** - Test seller application
5. **Upload Images** - Verify image uploads work
6. **Chat** - Test messaging between users

---

## Step 5: Post-Deployment Configuration

### 5.1 Update Supabase Allowed URLs
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to "Authentication" → "URL Configuration"
4. Add your Vercel URL to "Site URL":
   ```
   https://your-project.vercel.app
   ```
5. Add to "Redirect URLs":
   ```
   https://your-project.vercel.app/**
   ```

### 5.2 Update CORS Settings (if needed)
In Supabase Dashboard:
1. Go to "Settings" → "API"
2. Add your domain to allowed origins

---

## Automatic Deployments

### Enable Auto-Deploy from Git
Vercel automatically deploys when you push to your repository:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Vercel will automatically:
# 1. Detect the push
# 2. Build your project
# 3. Deploy to production
# 4. Update your live site
```

### Branch Deployments
- **main branch** → Production (your-project.vercel.app)
- **Other branches** → Preview deployments (branch-name.your-project.vercel.app)

---

## Monitoring & Analytics

### Vercel Analytics (Free)
1. Go to your project in Vercel
2. Click "Analytics" tab
3. View:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### Vercel Speed Insights
1. Install package:
   ```bash
   npm install @vercel/speed-insights
   ```

2. Add to your app:
   ```typescript
   // src/main.tsx
   import { SpeedInsights } from '@vercel/speed-insights/react';
   
   // Add <SpeedInsights /> to your root component
   ```

---

## Troubleshooting

### Build Fails
**Error**: "Command failed: npm run build:prod"
**Solution**: 
```bash
# Test build locally first
npm run build:prod

# Fix any TypeScript errors
npm run lint
```

### Environment Variables Not Working
**Error**: "Cannot read VITE_SUPABASE_URL"
**Solution**:
1. Check variables are prefixed with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache

### 404 on Page Refresh
**Error**: Page not found when refreshing
**Solution**: Already configured in `vercel.json` - all routes redirect to index.html

### Images Not Loading
**Error**: Images return 403 or 404
**Solution**:
1. Check Supabase Storage bucket is public
2. Verify image URLs in database
3. Check CORS settings in Supabase

---

## Performance Optimization

### Already Implemented ✅
- Image lazy loading
- Code splitting (Vite automatic)
- Asset caching (31536000 seconds)
- Gzip compression (Vercel automatic)
- CDN distribution (Vercel Edge Network)

### Additional Optimizations
1. **Enable Vercel Image Optimization**:
   - Automatic image resizing
   - WebP conversion
   - Lazy loading

2. **Monitor Core Web Vitals**:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

---

## Scaling & Upgrades

### Free Tier Limits
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ 6,000 build minutes/month

### When to Upgrade to Pro ($20/month)
- Traffic > 100GB/month
- Need custom domains
- Want advanced analytics
- Require password protection
- Need team collaboration

---

## Backup & Rollback

### Rollback to Previous Version
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find previous successful deployment
4. Click "..." → "Promote to Production"

### Download Deployment
```bash
# Using Vercel CLI
vercel pull
```

---

## Security Checklist

✅ **Completed**:
- Environment variables secured
- HTTPS enabled (automatic)
- Security headers configured
- XSS protection enabled
- Clickjacking protection enabled

⚠️ **Recommended**:
- Enable Vercel Firewall (Pro plan)
- Set up DDoS protection
- Configure rate limiting
- Enable Web Application Firewall

---

## Support & Resources

### Vercel Documentation
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support
- Community: https://github.com/vercel/vercel/discussions

### BESTOLD Support
- Check application logs in Vercel Dashboard
- Review Supabase logs for database issues
- Monitor error tracking in browser console

---

## Cost Estimate

### Free Tier (Hobby)
```
Vercel Hosting:     $0/month
Supabase Free:      $0/month
Domain (optional):  $12/year
Total:              $0-1/month
```

### Production (Recommended)
```
Vercel Pro:         $20/month
Supabase Pro:       $25/month
Domain:             $12/year
Total:              ~$46/month
```

---

## Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm deployment-url

# Link local project to Vercel
vercel link

# Pull environment variables
vercel env pull
```

---

## Success! 🎉

Your BESTOLD platform is now live and accessible worldwide!

**Next Steps**:
1. Share your URL with users
2. Monitor analytics and performance
3. Set up custom domain
4. Enable monitoring and alerts
5. Plan for scaling as traffic grows

**Your deployment URL**: `https://your-project.vercel.app`

---

*Last Updated: 2026-03-24*
