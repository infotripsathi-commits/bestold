import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Facebook,
  Twitter,
  Mail,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Store } from '@/types';

interface StoreQRCodeCardProps {
  store: Store;
}

const QR_SIZE = 240; // canvas px for QR module
const CARD_WIDTH = 320;
const CARD_HEIGHT = 420;

/** Generates a branded PNG data-URL: logo + store name + QR */
async function generateBrandedQR(store: Store, storeUrl: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Header background band
  ctx.fillStyle = '#16a34a'; // --primary green
  ctx.fillRect(0, 0, CARD_WIDTH, 72);

  // Store logo (if available) — draw circle avatar
  const logoSize = 44;
  const logoX = 20;
  const logoY = 14;

  if (store.banner_image_url) {
    try {
      const img = await loadImage(store.banner_image_url);
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch {
      drawInitialCircle(ctx, store.name, logoX, logoY, logoSize);
    }
  } else {
    drawInitialCircle(ctx, store.name, logoX, logoY, logoSize);
  }

  // Store name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textBaseline = 'middle';
  const nameX = logoX + logoSize + 12;
  const maxNameWidth = CARD_WIDTH - nameX - 16;
  const name = truncateText(ctx, store.name || 'My Store', maxNameWidth);
  ctx.fillText(name, nameX, logoY + 14);

  // Tagline
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#bbf7d0';
  ctx.fillText('Scan to visit store', nameX, logoY + 34);

  // QR code
  const qrDataUrl = await QRCode.toDataURL(storeUrl, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' },
  });
  const qrImg = await loadImage(qrDataUrl);
  const qrX = (CARD_WIDTH - QR_SIZE) / 2;
  const qrY = 84;
  ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

  // URL label
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const shortUrl = storeUrl.replace(/^https?:\/\//, '');
  ctx.fillText(shortUrl, CARD_WIDTH / 2, qrY + QR_SIZE + 20);

  // BESTOLD branding footer
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(0, CARD_HEIGHT - 44, CARD_WIDTH, 44);
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('bestold.in', CARD_WIDTH / 2, CARD_HEIGHT - 22);

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawInitialCircle(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  size: number,
) {
  ctx.fillStyle = '#bbf7d0';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#15803d';
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'S').charAt(0).toUpperCase(), x + size / 2, y + size / 2);
  ctx.textAlign = 'left';
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

export default function StoreQRCodeCard({ store }: StoreQRCodeCardProps) {
  const navigate = useNavigate();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [brandedDataUrl, setBrandedDataUrl] = useState('');
  const [generating, setGenerating] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasGenerated = useRef(false);

  const storeUrl = `${window.location.origin}/stores/${store.id}`;

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;

    const generate = async () => {
      try {
        // Simple QR for preview
        const simple = await QRCode.toDataURL(storeUrl, {
          width: QR_SIZE,
          margin: 2,
          color: { dark: '#111827', light: '#ffffff' },
        });
        setQrDataUrl(simple);

        // Branded card for download
        const branded = await generateBrandedQR(store, storeUrl);
        setBrandedDataUrl(branded);
      } catch (err) {
        console.error('QR generation failed', err);
      } finally {
        setGenerating(false);
      }
    };
    generate();
  }, [store, storeUrl]);

  const handleDownload = () => {
    if (!brandedDataUrl) return;
    const a = document.createElement('a');
    a.href = brandedDataUrl;
    a.download = `${(store.name || 'store').toLowerCase().replace(/\s+/g, '-')}-qr.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  const handleNativeShare = async () => {
    const shareData: ShareData = {
      title: `Visit ${store.name || 'my store'} on BestOld`,
      text: `Check out ${store.name || 'my store'} — scan the QR or open the link!`,
      url: storeUrl,
    };

    // Try sharing with QR image file if supported
    if (navigator.canShare && brandedDataUrl) {
      try {
        const blob = await (await fetch(brandedDataUrl)).blob();
        const file = new File([blob], 'store-qr.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
          toast.success('Shared successfully!');
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // fall through to URL-only share
      }
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback — open dialog
    setShareDialogOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success('Store link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please copy manually.');
    }
  };

  const handleShareVia = (platform: string) => {
    const enc = encodeURIComponent(storeUrl);
    const text = encodeURIComponent(`Check out ${store.name || 'my store'} on BestOld!`);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${enc}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${enc}`,
      telegram: `https://t.me/share/url?url=${enc}&text=${text}`,
      email: `mailto:?subject=${encodeURIComponent(`Visit ${store.name} on BestOld`)}&body=${text}%0A${enc}`,
    };
    if (urls[platform]) window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base text-balance">Store QR Code</CardTitle>
              <CardDescription className="text-pretty">
                Customers scan this to visit your store and see all your products instantly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* QR Preview */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="rounded-xl border-2 border-border p-3 bg-white shadow-sm">
                {generating ? (
                  <div className="w-[180px] h-[180px] flex items-center justify-center bg-muted rounded-lg animate-pulse">
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${store.name}`}
                    width={180}
                    height={180}
                    className="rounded"
                  />
                )}
              </div>
              {/* Store identity below QR */}
              <div className="flex items-center gap-2 max-w-[200px]">
                {store.banner_image_url ? (
                  <img
                    src={store.banner_image_url}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {(store.name || 'S').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {store.name || 'My Store'}
                </span>
              </div>
            </div>

            {/* Info + Actions */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Store URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 text-xs bg-muted px-2 py-1.5 rounded border border-border truncate font-mono">
                    {storeUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}
                    title="Open store page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p>📱 <span className="font-medium">Print it</span> — put it on your counter, display, or packaging.</p>
                <p>📤 <span className="font-medium">Share it</span> — post on WhatsApp, social media, or email.</p>
                <p>🛍️ <span className="font-medium">Customers scan</span> — they land directly on your store page with all products.</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={generating || !brandedDataUrl}
                  className="flex-1 min-w-[120px]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNativeShare}
                  disabled={generating}
                  className="flex-1 min-w-[120px]"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/seller/poster')}
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Poster
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog — fallback when native share is unavailable */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your store</DialogTitle>
            <DialogDescription>
              Send customers directly to <span className="font-medium text-foreground">{store.name || 'your store'}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* QR preview in dialog */}
            {qrDataUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={qrDataUrl}
                  alt="Store QR"
                  width={120}
                  height={120}
                  className="rounded border border-border"
                />
              </div>
            )}

            {/* Copy link */}
            <div className="space-y-1.5">
              <Label htmlFor="qr-store-url">Store Link</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-store-url"
                  value={storeUrl}
                  readOnly
                  className="flex-1 text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social sharing */}
            <div className="space-y-1.5">
              <Label>Share via</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => handleShareVia('whatsapp')}>
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleShareVia('telegram')}>
                  <svg className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  Telegram
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleShareVia('facebook')}>
                  <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                  Facebook
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleShareVia('twitter')}>
                  <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                  Twitter
                </Button>
                <Button variant="outline" className="col-span-2 justify-start" onClick={() => handleShareVia('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            {/* Download from dialog too */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => { handleDownload(); setShareDialogOpen(false); }}
              disabled={!brandedDataUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
