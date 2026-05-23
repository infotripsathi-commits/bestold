import { Download, X, Smartphone, Menu, MoreVertical, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BrowserType } from '@/hooks/useInstallPrompt';

function FloatingInstructions({ browser }: { browser: BrowserType }) {
  if (browser === 'ios') {
    return (
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">1.</span><span>Tap <Share className="inline h-4 w-4" /> <strong>Share</strong> at the bottom of Safari</span></li>
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">2.</span><span>Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span></li>
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">3.</span><span>Tap <strong>&ldquo;Add&rdquo;</strong></span></li>
        <li className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2 list-none">Must use <strong>Safari</strong> on iOS.</li>
      </ol>
    );
  }
  if (browser === 'samsung') {
    return (
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">1.</span><span>Tap <Menu className="inline h-4 w-4" /> <strong>Menu</strong> (&#8801;) at the bottom right</span></li>
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">2.</span><span>Tap <strong>&ldquo;Add page to&rdquo;</strong></span></li>
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">3.</span><span>Select <strong>&ldquo;Home screen&rdquo;</strong> → tap <strong>&ldquo;Add&rdquo;</strong></span></li>
        <li className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded p-2 list-none">Newer Samsung Internet may show <strong>&ldquo;Install&rdquo;</strong> directly in the menu.</li>
      </ol>
    );
  }
  if (browser === 'firefox') {
    return (
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">1.</span><span>Tap <MoreVertical className="inline h-4 w-4" /> <strong>Menu</strong> (&#8942;) at the top right</span></li>
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">2.</span><span>Tap <strong>&ldquo;Install&rdquo;</strong> or <strong>&ldquo;Add to Home Screen&rdquo;</strong></span></li>
        <li className="flex gap-2"><span className="font-bold text-primary shrink-0">3.</span><span>Tap <strong>&ldquo;Add&rdquo;</strong></span></li>
      </ol>
    );
  }
  // Chrome / Edge / generic
  return (
    <ol className="space-y-2 text-sm text-muted-foreground">
      <li className="flex gap-2"><span className="font-bold text-primary shrink-0">1.</span><span>Tap <MoreVertical className="inline h-4 w-4" /> <strong>Menu</strong> (&#8942;) at the top right</span></li>
      <li className="flex gap-2"><span className="font-bold text-primary shrink-0">2.</span><span>Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong></span></li>
      <li className="flex gap-2"><span className="font-bold text-primary shrink-0">3.</span><span>Tap <strong>&ldquo;Install&rdquo;</strong></span></li>
    </ol>
  );
}

/**
 * Floating Install Button
 *
 * Always visible on mobile until dismissed.
 * Triggers native prompt on Chrome/Edge; shows per-browser instructions
 * for Samsung Internet, iOS, Firefox, etc.
 */
export function FloatingInstallButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { isInstalled, browser, promptInstall } = useInstallPrompt();

  useEffect(() => {
    if (isInstalled) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const dismissed = localStorage.getItem('floating-install-dismissed');
    if (!dismissed) setIsVisible(true);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (isInstalled) {
      toast.info('BESTOLD is already installed on your device!');
      return;
    }
    const result = await promptInstall();
    if (result === true) {
      toast.success('BESTOLD installed successfully!');
      setIsVisible(false);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('floating-install-dismissed', 'true');
  };

  if (!isVisible) return null;

  const browserLabel: Record<BrowserType, string> = {
    samsung: 'Samsung Internet',
    ios: 'Safari (iOS)',
    chrome: 'Chrome',
    firefox: 'Firefox',
    edge: 'Edge',
    other: 'Your browser',
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <Card className="flex items-center gap-2 border-primary bg-primary p-2 shadow-lg">
          <Button size="sm" variant="secondary" onClick={handleInstall} className="h-10 gap-2">
            <Download className="h-4 w-4" />
            <span className="font-semibold">Install App</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 shrink-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* Installation Instructions Dialog */}
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
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <FloatingInstructions browser={browser} />
            </div>
            <Button className="w-full" onClick={() => setShowInstructions(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
