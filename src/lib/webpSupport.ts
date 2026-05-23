/**
 * WebP Browser Support Detection
 * Detects if the browser supports WebP image format
 */

let webpSupported: boolean | null = null;

/**
 * Check if browser supports WebP format
 * Uses canvas toDataURL to test WebP support
 * Result is cached for performance
 */
export async function checkWebPSupport(): Promise<boolean> {
  // Return cached result if available
  if (webpSupported !== null) {
    return webpSupported;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    // Try to convert canvas to WebP
    canvas.toBlob(
      (blob) => {
        // If blob is created, WebP is supported
        webpSupported = blob !== null && blob.type === 'image/webp';
        resolve(webpSupported);
      },
      'image/webp',
      0.5
    );
  });
}

/**
 * Synchronous check for WebP support
 * Returns cached result or false if not yet detected
 */
export function isWebPSupported(): boolean {
  return webpSupported === true;
}

/**
 * Get preferred image format based on browser support
 * @param forceJPEG - Force JPEG format even if WebP is supported
 * @returns 'image/webp' or 'image/jpeg'
 */
export async function getPreferredImageFormat(forceJPEG: boolean = false): Promise<string> {
  if (forceJPEG) {
    return 'image/jpeg';
  }

  const supportsWebP = await checkWebPSupport();
  return supportsWebP ? 'image/webp' : 'image/jpeg';
}

/**
 * Get file extension for image format
 */
export function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'jpg';
  }
}

/**
 * Get format name for display
 */
export function getFormatName(mimeType: string): string {
  switch (mimeType) {
    case 'image/webp':
      return 'WebP';
    case 'image/jpeg':
    case 'image/jpg':
      return 'JPEG';
    case 'image/png':
      return 'PNG';
    default:
      return 'JPEG';
  }
}

/**
 * Initialize WebP detection on page load
 * Call this early in app initialization
 */
export function initWebPDetection(): void {
  checkWebPSupport().then((supported) => {
    console.log(`WebP support: ${supported ? 'Yes' : 'No'}`);
  });
}
