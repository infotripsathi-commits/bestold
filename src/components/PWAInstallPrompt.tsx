import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import type { BrowserType } from '@/hooks/useInstallPrompt';

// Brief inline instructions shown in the banner's dialog (mirrors InstallAppButton dialog)
function BriefInstructions({ browser }: { browser: BrowserType }) {
  const steps: Record<BrowserType, string[]> = {
    samsung: [
      'Tap the Menu icon (≡) at the bottom right',
      'Tap "Add page to"',
      'Select "Home screen" → tap "Add"',
    ],
    ios: [
      'Tap the Share button (↑) at the bottom of Safari',
      'Scroll down → "Add to Home Screen"',
      'Tap "Add" in the top-right corner',
    ],
    chrome: [
      'Tap the Menu button (⋮) at the top-right of Chrome',
      'Tap "Install app" or "Add to Home screen"',
      'Tap "Install" to confirm — done!',
    ],
    firefox: [
      'Tap the Menu button (⋮) at the top right',
      'Tap "Install" or "Add to Home Screen"',
      'Tap "Add" to confirm',
    ],
    edge: [
      'Tap the Menu button (···) at the bottom',
      'Tap "Add to phone" or "Install app"',
      'Tap "Install" to confirm',
    ],
    other: [
      'Open your browser menu',
      'Look for "Install app" or "Add to Home Screen"',
      'Confirm to install',
    ],
  };

  const browserLabel: Record<BrowserType, string> = {
    samsung: 'Samsung Internet',
    ios: 'Safari (iOS)',
    chrome: 'Chrome',
    firefox: 'Firefox',
    edge: 'Edge',
    other: 'Your browser',
  };

  return (
    <div className="space-y-3">
      {browser === 'chrome' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
          Chrome's auto-install dialog may be temporarily unavailable (e.g. prompt was previously dismissed).
          Use the menu steps below — they always work.
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{browserLabel[browser]}</p>
      <ol className="space-y-2">
        {steps[browser].map((step, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="font-bold text-primary shrink-0">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {browser === 'ios' && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
          ⚠️ Must use <strong>Safari</strong> browser on iOS.
        </p>
      )}
      {browser === 'samsung' && (
        <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded p-2">
          💡 Newer Samsung Internet may show an <strong>"Install"</strong> option directly in the menu.
        </p>
      )}
      {browser === 'chrome' && (
        <p className="text-xs text-muted-foreground">
          💡 Chrome sometimes shows a <Download className="inline h-3 w-3" /> install icon in the address bar — tap it to install instantly.
        </p>
      )}
    </div>
  );
}

/**
 * PWA Install Prompt Banner
 *
 * - Only renders when the browser has fired beforeinstallprompt (hasNativePrompt).
 * - Android (Chrome/Edge): triggers native install dialog directly.
 * - iOS: shows "Add to Home Screen" tip inline (no native dialog available).
 * - Remembers dismissal for 7 days.
 */
export function PWAInstallPrompt() {
  const { isInstalled, hasNativePrompt, browser, promptInstall } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);

  useEffect(() => {
    if (isInstalled) return;

    // iOS: show the "Add to Home Screen" tip even without beforeinstallprompt
    // All other browsers: only show when we have a real native prompt
    const canShow = browser === 'ios' || hasNativePrompt;
    if (!canShow) return;

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (!dismissed || daysSince > 7) {
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, hasNativePrompt, browser]);

  const handleInstallClick = async () => {
    const result = await promptInstall();

    if (result === true) {
      setShowPrompt(false);
    } else {
      // No native prompt or dismissed — show manual steps in a dialog
      setShowInstructionsDialog(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  const isIOSBrowser = browser === 'ios';

  return (
    <>
      {/* ── Bottom banner ── */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <Card className="border-primary bg-card p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">Install BESTOLD App</h3>
                  <p className="text-sm text-muted-foreground">
                    {isIOSBrowser
                      ? 'Add to your home screen for a better experience'
                      : 'Install our app for faster access and offline support'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isIOSBrowser ? (
                // iOS — always manual
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Tap <span className="font-semibold">Share</span> (↑) then <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span>
                  </p>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleDismiss}>
                    Got it
                  </Button>
                </div>
              ) : (
                // Android — try native, fall back to dialog
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={handleInstallClick}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Instructions dialog (fallback for Samsung Internet, Firefox, etc.) ── */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install BESTOLD App
            </DialogTitle>
            <DialogDescription>
              Follow these quick steps to add BESTOLD to your home screen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <BriefInstructions browser={browser} />
            <Button
              className="w-full"
              onClick={() => {
                setShowInstructionsDialog(false);
                setShowPrompt(false);
                localStorage.setItem('pwa-install-dismissed', Date.now().toString());
              }}
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
