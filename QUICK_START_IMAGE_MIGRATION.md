# Quick Start: Compress Existing Images

## Overview

This guide helps you compress all existing images on your BESTOLD website to 100KB maximum for faster loading.

---

## Step 1: Install Dependencies

```bash
cd scripts
npm install
```

This installs the required libraries (Sharp for image compression).

---

## Step 2: Test with Dry Run

**Test without making any changes:**

```bash
node compress-existing-images-sharp.js --dry-run --limit=10
```

This will:
- ✅ Show what would be compressed
- ✅ Display estimated savings
- ✅ NOT modify any data

**Expected output:**
```
🚀 Image Compression Migration Script
=====================================

🔍 DRY RUN MODE - No changes will be made

Settings:
  Batch Size: 5
  Target Table: all
  Limit: 10
  Output Format: auto

📦 Processing Products...
Found 150 products with images

📦 Product: iPhone 12 (prod-123)
   Images: 3

   Image 1/3:
  📥 Downloading: https://...
  🔄 Compressing from 2500.00 KB...
  🔍 [DRY RUN] Would compress and re-upload

...

📊 Migration Summary
===================

Total Images:      10
Processed:         10
Compressed:        8
Skipped:           2 (already optimized)
Failed:            0

Original Size:     25.50 MB
Compressed Size:   0.85 MB
Savings:           24.65 MB (96.7%)

✅ This was a DRY RUN. Run without --dry-run to apply changes.
```

---

## Step 3: Run Full Migration

**After verifying dry run looks good:**

```bash
node compress-existing-images-sharp.js
```

This will:
- ✅ Download all images
- ✅ Compress to 100KB max
- ✅ Convert to WebP format
- ✅ Re-upload to Supabase
- ✅ Update database URLs

**Time estimate:**
- ~2-3 seconds per image
- 100 images = ~5 minutes
- 1000 images = ~45 minutes

**What to expect:**
```
🚀 Image Compression Migration Script
=====================================

Settings:
  Batch Size: 5
  Target Table: all
  Limit: none
  Output Format: auto

📦 Processing Products...
Found 150 products with images

📦 Product: iPhone 12 (prod-123)
   Images: 3

   Image 1/3:
  📥 Downloading: https://...
  🔄 Compressing from 2500.00 KB...
    Original: 2000x2000, jpeg, 2500.00 KB
    Compressed: 1920x1920, webp, 68.00 KB, quality 85
  📤 Uploading compressed image...
  ✅ Success: 2500.00 KB → 68.00 KB (97.3% smaller, WEBP)
   💾 Database updated

...

📊 Migration Summary
===================

Total Images:      450
Processed:         450
Compressed:        380
Skipped:           65 (already optimized)
Failed:            5

Format Distribution:
  WebP:            360
  JPEG:            20

Original Size:     850.50 MB
Compressed Size:   28.75 MB
Savings:           821.75 MB (96.6%)

Duration:          1250.50 seconds
Average:           2.78 seconds per image

📝 Log saved to: scripts/migration-log-1234567890.json

✅ Migration complete!
```

---

## Step 4: Verify Results

### Check Website

1. **Visit your website**
2. **Open a product page**
3. **Check images load quickly**
4. **Verify images display correctly**

### Check File Sizes

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Reload page**
4. **Check image sizes** - should be ~50-100 KB each

### Check Database

In Supabase Dashboard:
1. Go to Table Editor
2. Open Products table
3. Check image URLs
4. Should end with `.webp` or `.jpg`

---

## Troubleshooting

### Error: Missing environment variables

**Problem:**
```
❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY
```

**Solution:**
Add to `.env` file in project root:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Error: Cannot find module 'sharp'

**Problem:**
```
Error: Cannot find module 'sharp'
```

**Solution:**
```bash
cd scripts
npm install
```

### Images not compressing

**Problem:**
All images show "Already optimized"

**Solution:**
This is normal if images are already < 100KB. No compression needed.

### Script crashes

**Problem:**
Script stops with error

**Solution:**
1. Check error message
2. Fix issue (usually network or permissions)
3. Re-run script - it will skip already compressed images

---

## Advanced Options

### Compress Specific Table Only

```bash
# Products only
node compress-existing-images-sharp.js --table=products

# Categories only
node compress-existing-images-sharp.js --table=categories

# Stores only
node compress-existing-images-sharp.js --table=stores
```

### Test on Limited Images

```bash
# Test on first 50 images
node compress-existing-images-sharp.js --limit=50
```

### Force JPEG Format

```bash
# Use JPEG instead of WebP
node compress-existing-images-sharp.js --format=jpeg
```

---

## Expected Results

### Performance Improvements

**Before:**
- Product page: 3-5 seconds load time
- Images: 500KB - 5MB each
- Total bandwidth: High

**After:**
- Product page: 1-2 seconds load time
- Images: 50-100KB each
- Total bandwidth: 90-97% reduction

### Cost Savings

**For 1000 products with 5 images each:**

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Storage | 10 GB | 325 MB | 97% |
| Bandwidth | 1 TB/month | 32.5 GB/month | 97% |
| Cost | $12.50/month | $0.41/month | $12.09/month |

---

## Summary

✅ **Step 1**: Install dependencies (`cd scripts && npm install`)
✅ **Step 2**: Test with dry run (`--dry-run --limit=10`)
✅ **Step 3**: Run full migration (remove `--dry-run`)
✅ **Step 4**: Verify results on website

**Time**: ~2-3 seconds per image
**Risk**: Low (Supabase has automatic backups)
**Result**: 90-97% smaller images, 50-60% faster page loads

---

## Need Help?

See `EXISTING_IMAGES_MIGRATION_GUIDE.md` for complete documentation including:
- Detailed usage instructions
- All command line options
- Error handling and recovery
- Performance metrics
- Cost calculations
- FAQ and troubleshooting

---

**Ready to start?**

```bash
cd scripts
npm install
node compress-existing-images-sharp.js --dry-run --limit=10
```
