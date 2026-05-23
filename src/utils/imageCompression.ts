/**
 * Image Compression Utility
 * Compresses images to reduce file size while maintaining quality
 * Default: 80KB max size for 92% compression ratio
 * Supports WebP format for better compression (25-35% smaller than JPEG)
 * Supports automatic HEIC/HEIF → JPEG conversion (iPhone photos)
 */

import { checkWebPSupport, getFileExtension, getFormatName } from '@/lib/webpSupport';

export type OutputFormat = 'auto' | 'webp' | 'jpeg';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  outputFormat?: OutputFormat;
  webpQuality?: number;
  jpegQuality?: number;
}

export interface CompressionResult {
  file: File;
  format: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

// ─── HEIC/HEIF detection & conversion ────────────────────────────────────────

function isHeicFile(file: File): boolean {
  const heicMimeTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
  if (heicMimeTypes.includes(file.type.toLowerCase())) return true;
  // Also catch files where the browser reports type as '' (common on Android Chrome)
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif';
}

async function convertHeicToJpeg(file: File): Promise<File> {
  // Dynamic import — heic2any (~3 MB WASM) is only fetched when a HEIC file
  // is actually encountered, keeping the main bundle fast.
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(result) ? result[0] : result;
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compress an image file to meet size requirements
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.08, // Default 80KB (0.08MB) for 92% compression
    maxWidthOrHeight = 1920,
    quality = 0.88, // Balanced quality for 92% compression
    outputFormat = 'auto', // Auto-detect best format
    webpQuality = 0.80, // Balanced WebP compression
    jpegQuality = 0.88, // Balanced JPEG compression
  } = options;

  // ── Auto-convert HEIC/HEIF (iPhone photos) to JPEG before canvas processing ──
  // Browsers cannot decode HEIC natively; skip conversion and the Image element
  // would never fire onload, leaving the upload permanently stuck.
  if (isHeicFile(file)) {
    file = await convertHeicToJpeg(file);
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Determine output format
  let targetFormat = 'image/jpeg';
  let targetQuality = jpegQuality;

  if (outputFormat === 'auto') {
    const supportsWebP = await checkWebPSupport();
    if (supportsWebP) {
      targetFormat = 'image/webp';
      targetQuality = webpQuality;
    }
  } else if (outputFormat === 'webp') {
    targetFormat = 'image/webp';
    targetQuality = webpQuality;
  } else {
    targetFormat = 'image/jpeg';
    targetQuality = jpegQuality;
  }

  // If file is already small enough and correct format, return it
  if (file.size <= maxSizeBytes && file.type === targetFormat) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        try {
          // Try to compress with target format first
          let compressedFile = await tryCompressWithFormat(
            img,
            file,
            targetFormat,
            targetQuality,
            maxWidthOrHeight,
            maxSizeBytes
          );

          // If WebP was used and we're in auto mode, compare with JPEG
          if (outputFormat === 'auto' && targetFormat === 'image/webp') {
            const jpegFile = await tryCompressWithFormat(
              img,
              file,
              'image/jpeg',
              jpegQuality,
              maxWidthOrHeight,
              maxSizeBytes
            );

            // Use whichever is smaller
            if (jpegFile.size < compressedFile.size) {
              compressedFile = jpegFile;
            }
          }

          resolve(compressedFile);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Try to compress image with specific format
 */
async function tryCompressWithFormat(
  img: HTMLImageElement,
  originalFile: File,
  format: string,
  initialQuality: number,
  maxWidthOrHeight: number,
  maxSizeBytes: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = img;
    
    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
      if (width > height) {
        height = (height / width) * maxWidthOrHeight;
        width = maxWidthOrHeight;
      } else {
        width = (width / height) * maxWidthOrHeight;
        height = maxWidthOrHeight;
      }
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Use better image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);

    // Try different quality levels to meet size requirement
    let currentQuality = initialQuality;
    let currentWidth = width;
    let currentHeight = height;

    const tryCompress = (q: number, w: number, h: number) => {
      // Redraw if dimensions changed
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // If still too large, try reducing quality first
          if (blob.size > maxSizeBytes && q > 0.1) {
            tryCompress(q - 0.1, w, h);
            return;
          }

          // If quality is at minimum but still too large, reduce dimensions
          if (blob.size > maxSizeBytes && w > 400) {
            const newWidth = Math.floor(w * 0.9);
            const newHeight = Math.floor(h * 0.9);
            tryCompress(initialQuality, newWidth, newHeight);
            return;
          }

          // Create new file from blob
          const extension = getFileExtension(format);
          const newFileName = originalFile.name.replace(/\.[^.]+$/, `.${extension}`);
          const compressedFile = new File([blob], newFileName, {
            type: format,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        format,
        q
      );
    };

    tryCompress(currentQuality, currentWidth, currentHeight);
  });
}

/**
 * Validate if file is an image
 * @param file - File to validate
 * @returns true if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get compression info message
 * @param originalSize - Original file size in bytes
 * @param compressedSize - Compressed file size in bytes
 * @param format - Output format (image/webp or image/jpeg)
 * @returns Formatted message
 */
export function getCompressionInfo(
  originalSize: number,
  compressedSize: number,
  format: string
): string {
  const originalSizeText = formatFileSize(originalSize);
  const compressedSizeText = formatFileSize(compressedSize);
  const savings = Math.round((1 - compressedSize / originalSize) * 100);
  const formatName = getFormatName(format);
  
  return `${originalSizeText} → ${compressedSizeText} (${savings}% smaller, ${formatName})`;
}

