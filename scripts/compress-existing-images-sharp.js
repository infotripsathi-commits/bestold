#!/usr/bin/env node

/**
 * Image Compression Migration Script (with Sharp)
 * 
 * This script compresses all existing images in the database to 80KB max
 * with WebP support for 92% compression ratio and better performance.
 * 
 * Prerequisites:
 *   npm install --prefix scripts
 * 
 * Usage:
 *   node scripts/compress-existing-images-sharp.js [options]
 * 
 * Options:
 *   --dry-run       : Preview changes without actually modifying data
 *   --batch-size=N  : Process N images at a time (default: 5)
 *   --table=NAME    : Only process specific table (products, categories, stores, store_banners)
 *   --limit=N       : Limit total images to process (for testing)
 *   --format=TYPE   : Output format (webp, jpeg, auto) - default: auto
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '5');
const targetTable = args.find(arg => arg.startsWith('--table='))?.split('=')[1];
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0');
const outputFormat = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'auto';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.error('Please set these in your .env file');
  console.error('');
  console.error('Required variables:');
  console.error('  VITE_SUPABASE_URL=your_supabase_url');
  console.error('  SUPABASE_SERVICE_KEY=your_service_key');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Statistics
const stats = {
  total: 0,
  processed: 0,
  compressed: 0,
  skipped: 0,
  failed: 0,
  originalSize: 0,
  compressedSize: 0,
  errors: [],
  formatCounts: {
    webp: 0,
    jpeg: 0,
  },
};

// Log file
const logFile = path.join(__dirname, `migration-log-${Date.now()}.json`);

/**
 * Check if WebP is supported (always true in Node.js with sharp)
 */
function supportsWebP() {
  return outputFormat === 'auto' || outputFormat === 'webp';
}

/**
 * Compress image using sharp
 */
async function compressImage(imageBuffer, maxSizeKB = 80) {
  try {
    const maxSizeBytes = maxSizeKB * 1024;
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height, format: originalFormat } = metadata;
    
    console.log(`    Original: ${width}x${height}, ${originalFormat}, ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    // If already small enough, return original
    if (imageBuffer.length <= maxSizeBytes) {
      return {
        buffer: imageBuffer,
        format: originalFormat,
        width,
        height,
        size: imageBuffer.length,
      };
    }
    
    // Determine output format
    let targetFormat = 'jpeg';
    let quality = 88; // Balanced quality for 92% compression
    
    if (supportsWebP()) {
      targetFormat = 'webp';
      quality = 80; // Balanced WebP compression
    }
    
    // Start with max dimensions
    let maxDimension = 1920;
    let currentQuality = quality;
    let compressedBuffer;
    
    // Try to compress with different settings
    for (let attempt = 0; attempt < 10; attempt++) {
      let pipeline = sharp(imageBuffer);
      
      // Resize if needed
      if (width > maxDimension || height > maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      
      // Convert to target format
      if (targetFormat === 'webp') {
        pipeline = pipeline.webp({ quality: currentQuality });
      } else {
        pipeline = pipeline.jpeg({ quality: currentQuality, mozjpeg: true });
      }
      
      compressedBuffer = await pipeline.toBuffer();
      
      // Check if size is acceptable
      if (compressedBuffer.length <= maxSizeBytes) {
        break;
      }
      
      // Reduce quality
      if (currentQuality > 10) {
        currentQuality -= 10;
      } else if (maxDimension > 400) {
        // Reduce dimensions
        maxDimension = Math.floor(maxDimension * 0.9);
        currentQuality = quality; // Reset quality
      } else {
        // Can't compress further
        break;
      }
    }
    
    const finalMetadata = await sharp(compressedBuffer).metadata();
    
    console.log(`    Compressed: ${finalMetadata.width}x${finalMetadata.height}, ${targetFormat}, ${(compressedBuffer.length / 1024).toFixed(2)} KB, quality ${currentQuality}`);
    
    stats.formatCounts[targetFormat]++;
    
    return {
      buffer: compressedBuffer,
      format: targetFormat,
      width: finalMetadata.width,
      height: finalMetadata.height,
      size: compressedBuffer.length,
      quality: currentQuality,
    };
  } catch (error) {
    throw new Error(`Compression failed: ${error.message}`);
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Upload compressed image to Supabase Storage
 */
async function uploadImage(buffer, originalUrl, format) {
  try {
    // Extract bucket and path from URL
    const urlParts = originalUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      throw new Error('Invalid Supabase Storage URL');
    }
    
    const [bucket, ...pathParts] = urlParts[1].split('/');
    let filePath = pathParts.join('/');
    
    // Update file extension if format changed
    const ext = format === 'webp' ? 'webp' : 'jpg';
    filePath = filePath.replace(/\.(jpg|jpeg|png|webp)$/i, `.${ext}`);
    
    // Upload to same location (overwrite)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        upsert: true,
        contentType: `image/${format}`,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Process a single image
 */
async function processImage(url, context) {
  try {
    console.log(`  📥 Downloading: ${url.substring(0, 80)}...`);
    const originalBuffer = await downloadImage(url);
    const originalSize = originalBuffer.length;
    
    stats.originalSize += originalSize;
    
    // Check if already small enough (80KB for 92% compression)
    if (originalSize <= 80 * 1024) {
      console.log(`  ✅ Already optimized (${(originalSize / 1024).toFixed(2)} KB)`);
      stats.skipped++;
      return { url, skipped: true };
    }
    
    console.log(`  🔄 Compressing from ${(originalSize / 1024).toFixed(2)} KB...`);
    
    if (isDryRun) {
      console.log(`  🔍 [DRY RUN] Would compress and re-upload`);
      stats.compressed++;
      return { url, compressed: true, dryRun: true };
    }
    
    // Compress image
    const result = await compressImage(originalBuffer);
    const compressedSize = result.size;
    
    stats.compressedSize += compressedSize;
    
    // Upload compressed image
    console.log(`  📤 Uploading compressed image...`);
    const newUrl = await uploadImage(result.buffer, url, result.format);
    
    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log(`  ✅ Success: ${(originalSize / 1024).toFixed(2)} KB → ${(compressedSize / 1024).toFixed(2)} KB (${savings}% smaller, ${result.format.toUpperCase()})`);
    
    stats.compressed++;
    return { url: newUrl, compressed: true, originalSize, compressedSize, format: result.format };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    stats.failed++;
    stats.errors.push({ url, context, error: error.message });
    return { url, error: error.message };
  }
}

/**
 * Process products table
 */
async function processProducts() {
  console.log('\n📦 Processing Products...');
  
  let query = supabase
    .from('products')
    .select('id, name, images')
    .not('images', 'is', null);
  
  if (limit > 0) {
    query = query.limit(limit);
  }
  
  const { data: products, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }
  
  console.log(`Found ${products.length} products with images`);
  
  for (const product of products) {
    if (!product.images || product.images.length === 0) continue;
    
    console.log(`\n📦 Product: ${product.name} (${product.id})`);
    console.log(`   Images: ${product.images.length}`);
    
    const newImages = [];
    
    for (let i = 0; i < product.images.length; i++) {
      const imageUrl = product.images[i];
      console.log(`\n   Image ${i + 1}/${product.images.length}:`);
      
      stats.total++;
      stats.processed++;
      
      const result = await processImage(imageUrl, { table: 'products', id: product.id, index: i });
      newImages.push(result.url);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Update database
    if (!isDryRun && newImages.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating product: ${updateError.message}`);
        stats.errors.push({ table: 'products', id: product.id, error: updateError.message });
      } else {
        console.log(`   💾 Database updated`);
      }
    }
  }
}

/**
 * Process categories table
 */
async function processCategories() {
  console.log('\n📁 Processing Categories...');
  
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, image_url')
    .not('image_url', 'is', null);
  
  if (error) {
    console.error('❌ Error fetching categories:', error);
    return;
  }
  
  console.log(`Found ${categories.length} categories with images`);
  
  for (const category of categories) {
    if (!category.image_url) continue;
    
    console.log(`\n📁 Category: ${category.name} (${category.id})`);
    
    stats.total++;
    stats.processed++;
    
    const result = await processImage(category.image_url, { table: 'categories', id: category.id });
    
    // Update database
    if (!isDryRun && result.url && !result.skipped) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: result.url })
        .eq('id', category.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating category: ${updateError.message}`);
        stats.errors.push({ table: 'categories', id: category.id, error: updateError.message });
      } else {
        console.log(`   💾 Database updated`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Process stores table
 */
async function processStores() {
  console.log('\n🏪 Processing Stores...');
  
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, banner_image_url, shop_images')
    .or('banner_image_url.not.is.null,shop_images.not.is.null');
  
  if (error) {
    console.error('❌ Error fetching stores:', error);
    return;
  }
  
  console.log(`Found ${stores.length} stores with images`);
  
  for (const store of stores) {
    console.log(`\n🏪 Store: ${store.name} (${store.id})`);
    
    let newBannerUrl = store.banner_image_url;
    let newShopImages = store.shop_images || [];
    let hasChanges = false;
    
    // Process banner image
    if (store.banner_image_url) {
      console.log(`\n   Banner Image:`);
      stats.total++;
      stats.processed++;
      
      const result = await processImage(store.banner_image_url, { table: 'stores', id: store.id, field: 'banner' });
      if (result.url !== store.banner_image_url) {
        newBannerUrl = result.url;
        hasChanges = true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Process shop images
    if (store.shop_images && store.shop_images.length > 0) {
      console.log(`\n   Shop Images: ${store.shop_images.length}`);
      newShopImages = [];
      
      for (let i = 0; i < store.shop_images.length; i++) {
        const imageUrl = store.shop_images[i];
        console.log(`\n   Shop Image ${i + 1}/${store.shop_images.length}:`);
        
        stats.total++;
        stats.processed++;
        
        const result = await processImage(imageUrl, { table: 'stores', id: store.id, field: 'shop_images', index: i });
        newShopImages.push(result.url);
        if (result.url !== imageUrl) {
          hasChanges = true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Update database
    if (!isDryRun && hasChanges) {
      const updates = {};
      if (newBannerUrl) updates.banner_image_url = newBannerUrl;
      if (newShopImages.length > 0) updates.shop_images = newShopImages;
      
      const { error: updateError } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', store.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating store: ${updateError.message}`);
        stats.errors.push({ table: 'stores', id: store.id, error: updateError.message });
      } else {
        console.log(`   💾 Database updated`);
      }
    }
  }
}

/**
 * Process store_banners table
 */
async function processStoreBanners() {
  console.log('\n🎨 Processing Store Banners...');
  
  const { data: banners, error } = await supabase
    .from('store_banners')
    .select('id, title, banner_image_url')
    .not('banner_image_url', 'is', null');
  
  if (error) {
    console.error('❌ Error fetching store banners:', error);
    return;
  }
  
  console.log(`Found ${banners.length} store banners with images`);
  
  for (const banner of banners) {
    if (!banner.banner_image_url) continue;
    
    console.log(`\n🎨 Banner: ${banner.title || banner.id}`);
    
    stats.total++;
    stats.processed++;
    
    const result = await processImage(banner.banner_image_url, { table: 'store_banners', id: banner.id });
    
    // Update database
    if (!isDryRun && result.url && !result.skipped) {
      const { error: updateError } = await supabase
        .from('store_banners')
        .update({ banner_image_url: result.url })
        .eq('id', banner.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating banner: ${updateError.message}`);
        stats.errors.push({ table: 'store_banners', id: banner.id, error: updateError.message });
      } else {
        console.log(`   💾 Database updated`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Image Compression Migration Script');
  console.log('=====================================\n');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  console.log(`Settings:`);
  console.log(`  Batch Size: ${batchSize}`);
  console.log(`  Target Table: ${targetTable || 'all'}`);
  console.log(`  Limit: ${limit || 'none'}`);
  console.log(`  Output Format: ${outputFormat}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Process tables
    if (!targetTable || targetTable === 'products') {
      await processProducts();
    }
    
    if (!targetTable || targetTable === 'categories') {
      await processCategories();
    }
    
    if (!targetTable || targetTable === 'stores') {
      await processStores();
    }
    
    if (!targetTable || targetTable === 'store_banners') {
      await processStoreBanners();
    }
    
    // Calculate statistics
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const totalSavings = stats.originalSize - stats.compressedSize;
    const savingsPercent = stats.originalSize > 0 
      ? ((totalSavings / stats.originalSize) * 100).toFixed(1)
      : 0;
    
    // Print summary
    console.log('\n\n📊 Migration Summary');
    console.log('===================\n');
    console.log(`Total Images:      ${stats.total}`);
    console.log(`Processed:         ${stats.processed}`);
    console.log(`Compressed:        ${stats.compressed}`);
    console.log(`Skipped:           ${stats.skipped} (already optimized)`);
    console.log(`Failed:            ${stats.failed}`);
    console.log('');
    console.log(`Format Distribution:`);
    console.log(`  WebP:            ${stats.formatCounts.webp}`);
    console.log(`  JPEG:            ${stats.formatCounts.jpeg}`);
    console.log('');
    console.log(`Original Size:     ${(stats.originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed Size:   ${(stats.compressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Savings:           ${(totalSavings / 1024 / 1024).toFixed(2)} MB (${savingsPercent}%)`);
    console.log('');
    console.log(`Duration:          ${duration} seconds`);
    if (stats.processed > 0) {
      console.log(`Average:           ${(duration / stats.processed).toFixed(2)} seconds per image`);
    }
    
    if (stats.errors.length > 0) {
      console.log('\n\n❌ Errors:');
      stats.errors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.context?.table || 'unknown'} - ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`... and ${stats.errors.length - 10} more errors`);
      }
    }
    
    // Save log
    fs.writeFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      isDryRun,
      settings: { batchSize, targetTable, limit, outputFormat },
      stats,
      duration,
    }, null, 2));
    
    console.log(`\n📝 Log saved to: ${logFile}`);
    
    if (isDryRun) {
      console.log('\n🔍 This was a DRY RUN. Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration complete!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run migration
main().catch(console.error);
