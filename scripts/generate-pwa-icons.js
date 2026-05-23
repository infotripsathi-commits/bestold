#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * Generates all required PWA icons from the favicon.png file
 * 
 * Usage:
 *   node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Input and output paths
const publicDir = path.join(__dirname, '..', 'public');
const inputFile = path.join(publicDir, 'favicon.png');

console.log('🎨 PWA Icon Generator');
console.log('====================\n');

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error('❌ Error: favicon.png not found in public folder');
  console.error('Please add a favicon.png file (minimum 512x512) to the public folder');
  process.exit(1);
}

// Get input file dimensions
sharp(inputFile)
  .metadata()
  .then(metadata => {
    console.log(`📁 Input file: favicon.png`);
    console.log(`📐 Dimensions: ${metadata.width}x${metadata.height}`);
    console.log('');

    if (metadata.width < 512 || metadata.height < 512) {
      console.warn('⚠️  Warning: Input image is smaller than 512x512');
      console.warn('   Recommended minimum size: 512x512 pixels');
      console.warn('   Icons may appear blurry on high-resolution devices');
      console.warn('');
    }

    // Generate all icon sizes
    console.log('🔄 Generating icons...\n');

    const promises = sizes.map(size => {
      const outputFile = path.join(publicDir, `icon-${size}x${size}.png`);

      return sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputFile)
        .then(() => {
          console.log(`✅ Generated: icon-${size}x${size}.png`);
          return { size, success: true };
        })
        .catch(err => {
          console.error(`❌ Failed: icon-${size}x${size}.png - ${err.message}`);
          return { size, success: false, error: err.message };
        });
    });

    return Promise.all(promises);
  })
  .then(results => {
    console.log('');
    console.log('📊 Summary');
    console.log('==========\n');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successful: ${successful}/${sizes.length}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}/${sizes.length}`);
    }

    console.log('');
    console.log('📝 Generated files:');
    sizes.forEach(size => {
      const file = `icon-${size}x${size}.png`;
      const filePath = path.join(publicDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   ${file} (${sizeKB} KB)`);
      }
    });

    console.log('');
    console.log('✅ Icon generation complete!');
    console.log('');
    console.log('📱 Next steps:');
    console.log('   1. Check the generated icons in the public folder');
    console.log('   2. Test the PWA installation on your phone');
    console.log('   3. Verify icons appear correctly on home screen');
    console.log('');
    console.log('💡 Tip: For best results, use a high-quality logo (512x512 or larger)');
  })
  .catch(err => {
    console.error('');
    console.error('❌ Fatal error:', err.message);
    console.error('');
    process.exit(1);
  });
