# Existing Images Compression Migration

## Overview

This guide explains how to compress all existing images in the BESTOLD database to 100KB maximum with WebP support. This is a one-time migration to optimize images that were uploaded before the compression system was implemented.

---

## Why Compress Existing Images?

### Current Situation

- **New uploads**: Automatically compressed to 100KB with WebP support
- **Existing images**: Still at original size (500KB - 5MB+)
- **Problem**: Slow page loads for products/categories with old images

### Benefits of Migration

1. **Faster Page Loads**: 50-60% faster for pages with old images
2. **Reduced Bandwidth**: 80-95% less data transfer
3. **Lower Costs**: Significant storage and bandwidth savings
4. **Better UX**: Instant image loading across entire site
5. **Consistent Quality**: All images optimized to same standard

---

## Prerequisites

### 1. Install Dependencies

```bash
cd scripts
npm install
```

This installs:
- `@supabase/supabase-js` - Database access
- `sharp` - Image compression library
- `dotenv` - Environment variable loading

### 2. Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

**Important**: The script uses `SUPABASE_SERVICE_KEY` (not `VITE_SUPABASE_ANON_KEY`) to bypass Row Level Security and access all images.

---

## Migration Script

### Location

`/scripts/compress-existing-images-sharp.js`

### What It Does

1. **Fetches** all images from database tables:
   - Products (images array)
   - Categories (image_url)
   - Stores (banner_image_url, shop_images)
   - Store Banners (banner_image_url)

2. **Downloads** each image from Supabase Storage

3. **Compresses** using sharp library:
   - Target: 100KB maximum
   - Format: WebP (preferred) or JPEG
   - Quality: Automatically adjusted
   - Dimensions: Scaled if needed

4. **Uploads** compressed image back to Storage

5. **Updates** database with new URLs

6. **Logs** progress and results

---

## Usage

### Dry Run (Recommended First)

Test without making changes:

```bash
node scripts/compress-existing-images-sharp.js --dry-run
```

This will:
- Show what would be compressed
- Display estimated savings
- Not modify any data

### Test on Small Batch

Test on limited number of images:

```bash
node scripts/compress-existing-images-sharp.js --dry-run --limit=10
```

### Test Specific Table

Test on one table only:

```bash
node scripts/compress-existing-images-sharp.js --dry-run --table=categories
```

### Run Full Migration

After testing, run for real:

```bash
node scripts/compress-existing-images-sharp.js
```

### Run on Specific Table

Migrate one table at a time:

```bash
# Products only
node scripts/compress-existing-images-sharp.js --table=products

# Categories only
node scripts/compress-existing-images-sharp.js --table=categories

# Stores only
node scripts/compress-existing-images-sharp.js --table=stores

# Store banners only
node scripts/compress-existing-images-sharp.js --table=store_banners
```

---

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Preview without changes | `--dry-run` |
| `--batch-size=N` | Process N images at once | `--batch-size=5` |
| `--table=NAME` | Only process specific table | `--table=products` |
| `--limit=N` | Limit total images | `--limit=100` |
| `--format=TYPE` | Force format (webp/jpeg/auto) | `--format=webp` |

---

## Migration Process

### Step-by-Step

1. **Backup** (Optional but recommended):
   ```bash
   # Export current database
   # (Supabase has automatic backups, but good to be safe)
   ```

2. **Dry Run**:
   ```bash
   node scripts/compress-existing-images-sharp.js --dry-run --limit=10
   ```
   - Review output
   - Check estimated savings
   - Verify no errors

3. **Test Small Batch**:
   ```bash
   node scripts/compress-existing-images-sharp.js --limit=10
   ```
   - Verify images compressed
   - Check images display correctly
   - Confirm database updated

4. **Run Full Migration**:
   ```bash
   node scripts/compress-existing-images-sharp.js
   ```
   - Monitor progress
   - Check for errors
   - Wait for completion

5. **Verify Results**:
   - Check website images display
   - Verify page load times improved
   - Review migration log

---

## What Gets Compressed

### Products Table

**Field**: `images` (array)

**Example**:
```json
{
  "id": "123",
  "name": "iPhone 12",
  "images": [
    "https://...storage.../products/image1.jpg",  // 2.5 MB
    "https://...storage.../products/image2.jpg",  // 1.8 MB
    "https://...storage.../products/image3.jpg"   // 3.2 MB
  ]
}
```

**After**:
```json
{
  "id": "123",
  "name": "iPhone 12",
  "images": [
    "https://...storage.../products/image1.webp",  // 68 KB
    "https://...storage.../products/image2.webp",  // 52 KB
    "https://...storage.../products/image3.webp"   // 85 KB
  ]
}
```

### Categories Table

**Field**: `image_url` (string)

**Example**:
```json
{
  "id": "cat-1",
  "name": "Electronics",
  "image_url": "https://...storage.../categories/electronics.jpg"  // 500 KB
}
```

**After**:
```json
{
  "id": "cat-1",
  "name": "Electronics",
  "image_url": "https://...storage.../categories/electronics.webp"  // 65 KB
}
```

### Stores Table

**Fields**: `banner_image_url` (string), `shop_images` (array)

**Example**:
```json
{
  "id": "store-1",
  "name": "Tech Store",
  "banner_image_url": "https://...storage.../stores/banner.jpg",  // 1.2 MB
  "shop_images": [
    "https://...storage.../stores/shop1.jpg",  // 800 KB
    "https://...storage.../stores/shop2.jpg"   // 900 KB
  ]
}
```

**After**:
```json
{
  "id": "store-1",
  "name": "Tech Store",
  "banner_image_url": "https://...storage.../stores/banner.webp",  // 45 KB
  "shop_images": [
    "https://...storage.../stores/shop1.webp",  // 38 KB
    "https://...storage.../stores/shop2.webp"   // 42 KB
  ]
}
```

### Store Banners Table

**Field**: `banner_image_url` (string)

Similar to categories, single image per record.

---

## Output Example

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
  📥 Downloading: https://...storage.../products/image1.jpg...
  🔄 Compressing from 2500.00 KB...
    Original: 2000x2000, jpeg, 2500.00 KB
    Compressed: 1920x1920, webp, 68.00 KB, quality 85
  📤 Uploading compressed image...
  ✅ Success: 2500.00 KB → 68.00 KB (97.3% smaller, WEBP)

   Image 2/3:
  📥 Downloading: https://...storage.../products/image2.jpg...
  ✅ Already optimized (85.00 KB)

   Image 3/3:
  📥 Downloading: https://...storage.../products/image3.jpg...
  🔄 Compressing from 3200.00 KB...
    Original: 2400x2400, jpeg, 3200.00 KB
    Compressed: 1920x1920, webp, 85.00 KB, quality 80
  📤 Uploading compressed image...
  ✅ Success: 3200.00 KB → 85.00 KB (97.3% smaller, WEBP)

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

## Error Handling

### Common Errors

**1. Missing Environment Variables**
```
❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY
```
**Solution**: Add variables to `.env` file

**2. Download Failed**
```
❌ Error: Download failed: HTTP 404: Not Found
```
**Solution**: Image URL is invalid or file deleted. Script continues with next image.

**3. Compression Failed**
```
❌ Error: Compression failed: Input buffer contains unsupported image format
```
**Solution**: Image file is corrupted. Script continues with next image.

**4. Upload Failed**
```
❌ Error: Upload failed: Bucket not found
```
**Solution**: Check Supabase Storage bucket exists and is accessible.

### Error Recovery

The script:
- **Continues** on individual image errors
- **Logs** all errors to JSON file
- **Reports** errors in summary
- **Doesn't stop** entire migration for single failures

### Retry Failed Images

After migration, check log file for errors:

```bash
cat scripts/migration-log-*.json | grep -A 5 '"errors"'
```

Re-run for specific failed items (manual process).

---

## Verification

### 1. Check Images Display

Visit website and verify:
- Product pages show images correctly
- Category pages show icons
- Store pages show banners and galleries
- No broken images

### 2. Check File Sizes

In browser DevTools:
1. Open Network tab
2. Reload page
3. Check image sizes
4. Should be ~50-100 KB each

### 3. Check Database

```sql
-- Check products
SELECT id, name, images[1] as first_image
FROM products
WHERE images IS NOT NULL
LIMIT 10;

-- Check categories
SELECT id, name, image_url
FROM categories
WHERE image_url IS NOT NULL
LIMIT 10;
```

Verify URLs end with `.webp` or `.jpg`.

### 4. Check Storage

In Supabase Dashboard:
1. Go to Storage
2. Check `products` bucket
3. Verify file sizes reduced
4. Check file formats (WebP)

---

## Rollback

### If Something Goes Wrong

**Option 1: Restore from Backup**
- Supabase has automatic backups
- Restore from point before migration

**Option 2: Re-upload Original Images**
- If you saved original URLs
- Download from backup
- Re-upload manually

**Option 3: Let Users Re-upload**
- Users can edit products
- Upload new images
- New images will be compressed automatically

---

## Performance Impact

### Before Migration

**Example: Product page with 5 images**
- Image 1: 2.5 MB
- Image 2: 1.8 MB
- Image 3: 3.2 MB
- Image 4: 2.0 MB
- Image 5: 1.5 MB
- **Total**: 11 MB
- **Load Time**: 8-12 seconds (4G)

### After Migration

**Same product page**
- Image 1: 68 KB (WebP)
- Image 2: 52 KB (WebP)
- Image 3: 85 KB (WebP)
- Image 4: 60 KB (WebP)
- Image 5: 48 KB (WebP)
- **Total**: 313 KB
- **Load Time**: 1-2 seconds (4G)

**Improvement**: 97% smaller, 6-10x faster

---

## Cost Savings

### Storage Costs

**Before** (1000 products, 5 images each):
- Average: 2 MB per image
- Total: 10 GB
- Cost: $2.50/month

**After**:
- Average: 65 KB per image
- Total: 325 MB
- Cost: $0.08/month

**Savings**: $2.42/month (97% reduction)

### Bandwidth Costs

**Before** (100 views per product per month):
- Data transfer: 1 TB/month
- Cost: $10/month

**After**:
- Data transfer: 32.5 GB/month
- Cost: $0.33/month

**Savings**: $9.67/month (97% reduction)

### Total Savings

**Per 1000 products**: $12.09/month
**Per 10,000 products**: $120.90/month
**Per 100,000 products**: $1,209/month

---

## Best Practices

### Before Running

1. ✅ **Test with dry run** first
2. ✅ **Test on small batch** (--limit=10)
3. ✅ **Test one table** at a time
4. ✅ **Check Supabase backups** are enabled
5. ✅ **Run during low traffic** hours

### During Migration

1. ✅ **Monitor progress** in terminal
2. ✅ **Check for errors** in output
3. ✅ **Don't interrupt** the process
4. ✅ **Keep terminal open** until complete
5. ✅ **Save log file** for reference

### After Migration

1. ✅ **Verify images** display correctly
2. ✅ **Check page load** times improved
3. ✅ **Review error log** if any failures
4. ✅ **Test on mobile** devices
5. ✅ **Monitor user feedback**

---

## Troubleshooting

### Script Won't Start

**Problem**: `Cannot find module 'sharp'`
**Solution**:
```bash
cd scripts
npm install
```

**Problem**: `Missing environment variables`
**Solution**: Add to `.env`:
```env
VITE_SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
```

### Images Not Compressing

**Problem**: All images show "Already optimized"
**Solution**: Images are already < 100KB, no compression needed

**Problem**: Compression fails for all images
**Solution**: Check sharp installation:
```bash
cd scripts
npm rebuild sharp
```

### Database Not Updating

**Problem**: Images compressed but URLs not updated
**Solution**: Check `SUPABASE_SERVICE_KEY` has write permissions

**Problem**: "Row Level Security" error
**Solution**: Use service key, not anon key

### Images Not Displaying

**Problem**: Broken images after migration
**Solution**: Check Storage bucket permissions are public

**Problem**: Some images missing
**Solution**: Check error log, re-upload failed images

---

## FAQ

**Q: Will this delete original images?**
A: Yes, compressed images overwrite originals in Storage. Database URLs are updated.

**Q: Can I undo the migration?**
A: Only by restoring from Supabase backup or re-uploading original images.

**Q: How long does it take?**
A: ~2-3 seconds per image. 1000 images = ~45 minutes.

**Q: Will it affect live website?**
A: Minimal impact. Images are replaced one at a time. Brief moment where old URL might not work.

**Q: What if script crashes?**
A: Re-run it. Already compressed images will be skipped.

**Q: Can I run it multiple times?**
A: Yes, safe to re-run. Already optimized images are skipped.

**Q: Does it work with PNG images?**
A: Yes, converts PNG to WebP or JPEG automatically.

**Q: What about transparency?**
A: PNG transparency is lost (converted to white background). If transparency is critical, use `--format=jpeg` to preserve quality.

---

## Summary

### What This Does

✅ Compresses all existing images to 100KB max
✅ Converts to WebP format (or JPEG)
✅ Updates database with new URLs
✅ Provides detailed progress and logging
✅ Handles errors gracefully
✅ Can be run multiple times safely

### Expected Results

✅ 90-97% reduction in image sizes
✅ 50-60% faster page load times
✅ 90-97% reduction in bandwidth usage
✅ 90-97% reduction in storage costs
✅ Better user experience across entire site
✅ Consistent image quality

### Next Steps

1. Install dependencies: `cd scripts && npm install`
2. Test with dry run: `node compress-existing-images-sharp.js --dry-run --limit=10`
3. Run migration: `node compress-existing-images-sharp.js`
4. Verify results on website
5. Monitor performance improvements

---

**Status**: Ready to use
**Estimated Time**: 2-3 seconds per image
**Risk Level**: Low (can restore from backup)
**Recommended**: Run during low traffic hours
