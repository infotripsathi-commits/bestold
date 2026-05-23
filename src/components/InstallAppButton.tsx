import { Download, Smartphone, Share, MoreVertical, Menu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { toast } from 'sonner';
import type { BrowserType } from '@/hooks/useInstallPrompt';

interface InstallAppButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

// ─── Per-browser install instructions ────────────────────────────────────────
function ChromeInstructions({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div className="space-y-4">

      {/* ── Option A: try the native dialog first ──────────────────── */}
      <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Option 1 — Try the auto-install dialog</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Chrome's automatic install popup may have been suppressed (e.g. you tapped
          "Cancel" before, or the app was previously installed). Tap below to check if
          it's available now.
        </p>
        <Button
          className="w-full"
          onClick={onRetry}
          disabled={retrying}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Checking…' : 'Try auto-install dialog'}
        </Button>
      </div>

      {/* ── Option B: Chrome menu (always works) ───────────────────── */}
      <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Option 2 — Install from Chrome's menu <span className="text-primary">(always works)</span></p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2 items-start">
            <span className="font-bold text-primary shrink-0 w-5">1.</span>
            <span>
              Tap the <MoreVertical className="inline h-4 w-4 align-text-bottom" />{' '}
              <strong className="text-foreground">three-dot menu</strong> at the top-right of Chrome
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="font-bold text-primary shrink-0 w-5">2.</span>
            <span>
              Tap <strong className="text-foreground">"Install app"</strong>{' '}
              or <strong className="text-foreground">"Add to Home screen"</strong>
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <span className="font-bold text-primary shrink-0 w-5">3.</span>
            <span>Tap <strong className="text-foreground">"Install"</strong> — done!</span>
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          💡 Chrome sometimes shows a <Download className="inline h-3 w-3" /> icon
          inside the address bar — tap it to install instantly.
        </p>
      </div>

      {/* ── Option C: reset Chrome so auto-dialog fires again ──────── */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-2">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Option 3 — Reset Chrome to get the popup back
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          If you previously dismissed or cancelled the install dialog on bestold.in,
          Chrome blocks it for ~3 months. To reset it:
        </p>
        <ol className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
          <li className="flex gap-2">
            <span className="font-bold shrink-0">1.</span>
            <span>Open Chrome → tap the <MoreVertical className="inline h-3 w-3 align-text-bottom" /> menu → <strong>Settings</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">2.</span>
            <span>Tap <strong>Site settings</strong> → <strong>All sites</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">3.</span>
            <span>Find <strong>bestold.in</strong> → tap <strong>Clear &amp; reset</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">4.</span>
            <span>Return to bestold.in and tap <strong>Install</strong> — the popup will appear</span>
          </li>
        </ol>
      </div>

    </div>
  );
}

function InstallInstructions({
  browser,
  onRetry,
  retrying,
}: {
  browser: BrowserType;
  onRetry: () => void;
  retrying: boolean;
}) {
  if (browser === 'ios') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <h4 className="font-semibold text-foreground">Safari on iPhone / iPad</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">1.</span>
            <span>Tap the <Share className="inline h-4 w-4 mx-0.5 text-blue-500" /> <strong>Share</strong> button at the bottom of Safari</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">2.</span>
            <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">3.</span>
            <span>Tap <strong>&ldquo;Add&rdquo;</strong> in the top-right corner</span>
          </li>
        </ol>
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2 mt-1">
          Must use <strong>Safari</strong> — this won&apos;t work in Chrome or Firefox on iOS.
        </p>
      </div>
    );
  }

  if (browser === 'samsung') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <h4 className="font-semibold text-foreground">Samsung Internet Browser</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">1.</span>
            <span>Tap the <Menu className="inline h-4 w-4 mx-0.5" /> <strong>Menu</strong> icon (&#8801;) at the bottom right</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">2.</span>
            <span>Tap <strong>&ldquo;Add page to&rdquo;</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">3.</span>
            <span>Select <strong>&ldquo;Home screen&rdquo;</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">4.</span>
            <span>Tap <strong>&ldquo;Add&rdquo;</strong> to confirm</span>
          </li>
        </ol>
        <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded p-2 mt-1">
          In newer Samsung Internet you may see an <strong>&ldquo;Install&rdquo;</strong> option directly in the menu.
        </p>
      </div>
    );
  }

  if (browser === 'firefox') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <h4 className="font-semibold text-foreground">Firefox on Android</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">1.</span>
            <span>Tap the <MoreVertical className="inline h-4 w-4 mx-0.5" /> <strong>Menu</strong> button (&#8942;) at the top right</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">2.</span>
            <span>Tap <strong>&ldquo;Install&rdquo;</strong> or <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">3.</span>
            <span>Tap <strong>&ldquo;Add&rdquo;</strong> to confirm</span>
          </li>
        </ol>
      </div>
    );
  }

  if (browser === 'edge') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <h4 className="font-semibold text-foreground">Microsoft Edge</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">1.</span>
            <span>Tap the <MoreVertical className="inline h-4 w-4 mx-0.5" /> <strong>Menu</strong> button (&#8943;) at the bottom</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">2.</span>
            <span>Tap <strong>&ldquo;Add to phone&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary shrink-0">3.</span>
            <span>Tap <strong>&ldquo;Install&rdquo;</strong> to confirm</span>
          </li>
        </ol>
      </div>
    );
  }

  // Chrome / generic Android — richest instructions
  return <ChromeInstructions onRetry={onRetry} retrying={retrying} />;
}

/**
 * Install App Button Component
 *
 * Triggers the native browser install prompt where supported.
 * Falls back to per-browser step-by-step instructions
 * (Samsung Internet, iOS Safari, Firefox, Edge, Chrome).
 */
export function InstallAppButton({
  variant = 'outline',
  size = 'default',
  showIcon = true,
  className = '',
}: InstallAppButtonProps) {
  const { isInstalled, browser, promptInstall } = useInstallPrompt();
  const [showInstructions, setShowInstructions] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  // Detect via getInstalledRelatedApps if available
  useEffect(() => {
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: unknown[]) => {
        if (apps.length > 0) setAlreadyInstalled(true);
      }).catch(() => {/* ignore */});
    }
  }, []);

  const handleClick = async () => {
    if (isInstalled || alreadyInstalled) {
      toast.info('BESTOLD is already installed on your device!');
      return;
    }

    // Try native prompt first (reads window.__pwaInstallPrompt)
    const result = await promptInstall();

    if (result === true) {
      toast.success('BESTOLD installed successfully! 🎉');
    } else {
      // null = no native prompt  |  false = user dismissed native prompt
      setShowInstructions(true);
    }
  };

  // "Try again" inside the instructions dialog — re-checks for a deferred prompt
  const handleRetry = async () => {
    setRetrying(true);
    // Give the browser a moment to dispatch the event if it hasn't yet
    await new Promise((r) => setTimeout(r, 600));

    const result = await promptInstall();
    setRetrying(false);

    if (result === true) {
      toast.success('BESTOLD installed successfully! 🎉');
      setShowInstructions(false);
    } else if (result === false) {
      toast.info('You dismissed the install dialog — you can try again anytime.');
    } else {
      toast.info("Chrome's install dialog isn't available right now — please use the menu steps below.");
    }
  };

  const browserLabel: Record<BrowserType, string> = {
    samsung: 'Samsung Internet',
    ios: 'Safari (iOS)',
    chrome: 'Chrome',
    firefox: 'Firefox',
    edge: 'Edge',
    other: 'your browser',
  };

  const effectivelyInstalled = isInstalled || alreadyInstalled;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        {showIcon && (
          effectivelyInstalled
            ? <CheckCircle2 className="mr-2 h-4 w-4" />
            : <Download className="mr-2 h-4 w-4" />
        )}
        <span className="hidden sm:inline">{effectivelyInstalled ? 'Installed ✓' : 'Install App'}</span>
        <span className="sm:hidden">{effectivelyInstalled ? '✓' : 'Install'}</span>
      </Button>

      {/* Manual install instructions dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install BESTOLD App
            </DialogTitle>
            <DialogDescription>
              Steps for <strong>{browserLabel[browser]}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <InstallInstructions browser={browser} onRetry={handleRetry} retrying={retrying} />

            {/* Benefits */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <h4 className="font-semibold text-foreground text-sm">Why install?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {[
                  'Launch from home screen — no browser needed',
                  'Faster loading & offline browsing',
                  'Full-screen experience',
                  'Get order & message notifications',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="text-primary shrink-0">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {browser !== 'chrome' && browser !== 'other' && (
              <Button className="w-full" onClick={() => setShowInstructions(false)}>
                Got it!
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
