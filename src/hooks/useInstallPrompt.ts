import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend window to include the early-captured prompt
declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null;
  }
}

export type BrowserType = 'samsung' | 'ios' | 'chrome' | 'firefox' | 'edge' | 'other';

export function detectBrowser(): BrowserType {
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Edg\//i.test(ua)) return 'edge';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Chrome/i.test(ua)) return 'chrome';
  return 'other';
}

/**
 * Hook to manage PWA installation.
 *
 * Reads window.__pwaInstallPrompt which is set by an inline <script> in
 * index.html BEFORE React loads, avoiding the race condition where
 * beforeinstallprompt fires before useEffect runs (common on fast hosts).
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    // Immediately read whatever was captured before React mounted
    () => (typeof window !== 'undefined' ? window.__pwaInstallPrompt : null)
  );
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [browser, setBrowser] = useState<BrowserType>('other');

  useEffect(() => {
    // Already installed (standalone mode)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const detectedBrowser = detectBrowser();
    setBrowser(detectedBrowser);

    // iOS / Samsung / Firefox — no beforeinstallprompt, but installable via menu
    if (
      detectedBrowser === 'ios' ||
      detectedBrowser === 'samsung' ||
      detectedBrowser === 'firefox'
    ) {
      setIsInstallable(true);
    }

    // Pick up the prompt that was captured before React mounted
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
      setIsInstallable(true);
    }

    // Also listen for the custom relay event fired by the inline script
    const handleInstallable = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setIsInstallable(true);
      }
    };

    // Handle native event arriving AFTER React mounts (less common, but safe)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
    };

    // Also handle the custom pwa-installed event
    const handlePwaInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handlePwaInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handlePwaInstalled);
    };
  }, []);

  /**
   * Triggers the native install prompt if available.
   * Returns: true = installed, false = dismissed, null = no prompt available (show manual instructions)
   */
  const promptInstall = async (): Promise<boolean | null> => {
    if (isInstalled) return true;

    // Re-read from window in case it was set after initial render
    const prompt = deferredPrompt ?? window.__pwaInstallPrompt;

    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      // Clear the used prompt
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        return true;
      }
      return false;
    }

    // No native prompt — caller should show manual instructions
    return null;
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    /** True only when the browser has fired beforeinstallprompt and we can trigger the native dialog */
    hasNativePrompt: (deferredPrompt !== null || (typeof window !== 'undefined' && !!window.__pwaInstallPrompt)) && !isInstalled,
    browser,
    promptInstall,
  };
}
