import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';
import { getStoreByUserId } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Store } from '@/types';

// ─── A4 poster canvas dimensions (300dpi equivalent, then scaled for screen) ──
const A4_W = 794;   // px ~ A4 at 96dpi
const A4_H = 1123;  // px ~ A4 at 96dpi
const QR_SIZE = 280;

// ─── Colour themes ─────────────────────────────────────────────────────────────
type Theme = 'green' | 'dark' | 'blue' | 'warm';
interface ThemeConfig {
  label: string;
  headerBg: string;
  headerText: string;
  accentBg: string;
  accentText: string;
  bodyBg: string;
  bodyText: string;
  mutedText: string;
  qrDark: string;
  qrLight: string;
  footerBg: string;
  footerText: string;
  borderColor: string;
}
const THEMES: Record<Theme, ThemeConfig> = {
  green: {
    label: 'Fresh Green',
    headerBg: '#16a34a',
    headerText: '#ffffff',
    accentBg: '#dcfce7',
    accentText: '#15803d',
    bodyBg: '#ffffff',
    bodyText: '#111827',
    mutedText: '#6b7280',
    qrDark: '#111827',
    qrLight: '#ffffff',
    footerBg: '#f0fdf4',
    footerText: '#16a34a',
    borderColor: '#bbf7d0',
  },
  dark: {
    label: 'Midnight Dark',
    headerBg: '#111827',
    headerText: '#f9fafb',
    accentBg: '#1f2937',
    accentText: '#f3f4f6',
    bodyBg: '#1f2937',
    bodyText: '#f9fafb',
    mutedText: '#9ca3af',
    qrDark: '#f9fafb',
    qrLight: '#1f2937',
    footerBg: '#111827',
    footerText: '#6b7280',
    borderColor: '#374151',
  },
  blue: {
    label: 'Ocean Blue',
    headerBg: '#1d4ed8',
    headerText: '#ffffff',
    accentBg: '#dbeafe',
    accentText: '#1e40af',
    bodyBg: '#ffffff',
    bodyText: '#1e3a5f',
    mutedText: '#6b7280',
    qrDark: '#1e3a5f',
    qrLight: '#ffffff',
    footerBg: '#eff6ff',
    footerText: '#1d4ed8',
    borderColor: '#bfdbfe',
  },
  warm: {
    label: 'Warm Amber',
    headerBg: '#b45309',
    headerText: '#fffbeb',
    accentBg: '#fef3c7',
    accentText: '#92400e',
    bodyBg: '#fffbeb',
    bodyText: '#1c1917',
    mutedText: '#78716c',
    qrDark: '#1c1917',
    qrLight: '#fffbeb',
    footerBg: '#fef3c7',
    footerText: '#b45309',
    borderColor: '#fde68a',
  },
};

// ─── CTA options ───────────────────────────────────────────────────────────────
const CTA_OPTIONS = [
  'Scan to explore our store!',
  'Scan & shop second-hand deals!',
  'Find amazing deals — Scan now!',
  'Visit our store online — Scan me!',
  'Great prices on pre-owned goods!',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const words = text.split(' ');
  let line = '';
  let linesDrawn = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + linesDrawn * lineHeight);
      line = word;
      linesDrawn++;
      if (linesDrawn >= maxLines) { ctx.fillText(`${line}…`, x, y + linesDrawn * lineHeight); return linesDrawn + 1; }
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, x, y + linesDrawn * lineHeight); linesDrawn++; }
  return linesDrawn;
}

// ─── Main poster generator ─────────────────────────────────────────────────────
async function generatePoster(
  store: Store,
  storeUrl: string,
  theme: ThemeConfig,
  ctaText: string,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = A4_W;
  canvas.height = A4_H;
  const ctx = canvas.getContext('2d')!;
  const T = theme;
  const pad = 48;

  // ── Background ──
  ctx.fillStyle = T.bodyBg;
  ctx.fillRect(0, 0, A4_W, A4_H);

  // ── Decorative top stripe ──
  ctx.fillStyle = T.headerBg;
  ctx.fillRect(0, 0, A4_W, 180);

  // ── Subtle diagonal pattern on header ──
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = T.headerText;
  ctx.lineWidth = 1;
  for (let i = -200; i < A4_W + 200; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 180, 180);
    ctx.stroke();
  }
  ctx.restore();

  // ── BESTOLD wordmark (top-left) ──
  ctx.fillStyle = T.headerText;
  ctx.globalAlpha = 0.25;
  ctx.font = `900 11px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '3px';
  ctx.fillText('BESTOLD', pad, 24);
  ctx.globalAlpha = 1;

  // ── Store logo circle ──
  const logoR = 56;
  const logoCX = A4_W / 2;
  const logoCY = 180;

  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR + 4, 0, Math.PI * 2);
  ctx.fillStyle = T.bodyBg;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR, 0, Math.PI * 2);
  ctx.clip();

  if (store.banner_image_url) {
    try {
      const img = await loadImage(store.banner_image_url);
      ctx.drawImage(img, logoCX - logoR, logoCY - logoR, logoR * 2, logoR * 2);
    } catch {
      ctx.fillStyle = T.accentBg;
      ctx.fillRect(logoCX - logoR, logoCY - logoR, logoR * 2, logoR * 2);
      ctx.fillStyle = T.accentText;
      ctx.font = `bold ${logoR}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((store.name || 'S').charAt(0).toUpperCase(), logoCX, logoCY);
    }
  } else {
    ctx.fillStyle = T.accentBg;
    ctx.fillRect(logoCX - logoR, logoCY - logoR, logoR * 2, logoR * 2);
    ctx.fillStyle = T.accentText;
    ctx.font = `bold ${logoR}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((store.name || 'S').charAt(0).toUpperCase(), logoCX, logoCY);
  }
  ctx.restore();

  // ── Store name ──
  let cursorY = logoCY + logoR + 32;
  ctx.fillStyle = T.bodyText;
  ctx.font = `bold 36px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const storeName = store.name || 'My Store';
  // truncate if too wide
  let displayName = storeName;
  while (ctx.measureText(displayName).width > A4_W - pad * 2 && displayName.length > 1) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== storeName) displayName += '…';
  ctx.fillText(displayName, A4_W / 2, cursorY);
  cursorY += 46;

  // ── Location pill ──
  if (store.location) {
    ctx.font = `14px sans-serif`;
    const locText = `📍 ${store.location}`;
    const locW = Math.min(ctx.measureText(locText).width + 28, A4_W - pad * 2);
    const locX = (A4_W - locW) / 2;
    ctx.fillStyle = T.accentBg;
    roundRect(ctx, locX, cursorY, locW, 28, 14);
    ctx.fill();
    ctx.fillStyle = T.accentText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(locText, A4_W / 2, cursorY + 14);
    cursorY += 44;
  }

  // ── Thin divider ──
  ctx.strokeStyle = T.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, cursorY);
  ctx.lineTo(A4_W - pad, cursorY);
  ctx.stroke();
  cursorY += 28;

  // ── Description (up to 3 lines) ──
  if (store.description) {
    ctx.fillStyle = T.mutedText;
    ctx.font = `15px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const lines = wrapText(ctx, store.description, A4_W / 2, cursorY, A4_W - pad * 2, 22, 3);
    cursorY += lines * 22 + 20;
  }

  // ── QR Code ──
  const qrDataUrl = await QRCode.toDataURL(storeUrl, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: T.qrDark, light: T.qrLight },
    errorCorrectionLevel: 'H',
  });
  const qrImg = await loadImage(qrDataUrl);

  // QR background card
  const qrCardPad = 20;
  const qrCardW = QR_SIZE + qrCardPad * 2;
  const qrCardH = QR_SIZE + qrCardPad * 2;
  const qrCardX = (A4_W - qrCardW) / 2;
  const qrCardY = cursorY;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = T.qrLight;
  roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 16);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(qrImg, qrCardX + qrCardPad, qrCardY + qrCardPad, QR_SIZE, QR_SIZE);
  cursorY += qrCardH + 24;

  // ── CTA text ──
  ctx.fillStyle = T.bodyText;
  ctx.font = `bold 22px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(ctaText, A4_W / 2, cursorY);
  cursorY += 36;

  // ── Store URL ──
  ctx.fillStyle = T.mutedText;
  ctx.font = `12px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(storeUrl.replace(/^https?:\/\//, ''), A4_W / 2, cursorY);
  cursorY += 28;

  // ── Phone number (if available) ──
  const phone = store.phone_number || store.contact_phone || store.contact_info;
  if (phone) {
    ctx.font = `14px sans-serif`;
    ctx.fillStyle = T.mutedText;
    ctx.fillText(`📞 ${phone}`, A4_W / 2, cursorY);
    cursorY += 24;
  }

  // ── Footer ──
  const footerH = 60;
  const footerY = A4_H - footerH;
  ctx.fillStyle = T.footerBg;
  ctx.fillRect(0, footerY, A4_W, footerH);

  ctx.strokeStyle = T.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(A4_W, footerY);
  ctx.stroke();

  ctx.fillStyle = T.footerText;
  ctx.font = `bold 14px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('bestold.in  ·  Buy & Sell Second-Hand Goods', A4_W / 2, footerY + footerH / 2);

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Page component ────────────────────────────────────────────────────────────
export default function StorePosterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('green');
  const [selectedCTA, setSelectedCTA] = useState(CTA_OPTIONS[0]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load store
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getStoreByUserId(user.id)
      .then((s) => { setStore(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, navigate]);

  // Regenerate poster whenever theme / CTA changes
  useEffect(() => {
    if (!store) return;
    const storeUrl = `${window.location.origin}/stores/${store.id}`;
    setRendering(true);
    generatePoster(store, storeUrl, THEMES[selectedTheme], selectedCTA)
      .then((canvas) => {
        setPosterDataUrl(canvas.toDataURL('image/png'));
        // copy to visible canvas for crisp preview
        const visible = canvasRef.current;
        if (visible) {
          const vCtx = visible.getContext('2d')!;
          visible.width = canvas.width;
          visible.height = canvas.height;
          vCtx.drawImage(canvas, 0, 0);
        }
      })
      .finally(() => setRendering(false));
  }, [store, selectedTheme, selectedCTA]);

  const handleDownload = () => {
    if (!posterDataUrl || !store) return;
    const a = document.createElement('a');
    a.href = posterDataUrl;
    a.download = `${(store.name || 'store').toLowerCase().replace(/\s+/g, '-')}-poster.png`;
    a.click();
    toast.success('Poster downloaded!');
  };

  const handlePrint = () => {
    if (!posterDataUrl) return;
    const win = window.open('', '_blank');
    if (!win) { toast.error('Popup blocked — please allow popups for this site.'); return; }
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${store?.name || 'Store'} — Poster</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    img { display: block; width: 210mm; height: 297mm; object-fit: contain; page-break-after: avoid; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <img src="${posterDataUrl}" />
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 300);
    };
  </script>
</body>
</html>`);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">
          You need to create a store before generating a poster.
        </p>
        <Button asChild>
          <Link to="/seller/store">Create Store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Toolbar (hidden on print) ── */}
      <div className="sticky top-0 z-10 bg-background border-b border-border print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to="/seller/store">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>

          <span className="text-sm font-semibold text-foreground hidden md:inline">
            Store Poster
          </span>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Theme selector */}
            <Select value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as Theme)}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(THEMES) as [Theme, ThemeConfig][]).map(([key, t]) => (
                  <SelectItem key={key} value={key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* CTA selector */}
            <Select value={selectedCTA} onValueChange={setSelectedCTA}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue placeholder="Call-to-action" />
              </SelectTrigger>
              <SelectContent>
                {CTA_OPTIONS.map((cta) => (
                  <SelectItem key={cta} value={cta}>{cta}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={rendering || !posterDataUrl}
              className="shrink-0"
            >
              {rendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
              Download PNG
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              disabled={rendering || !posterDataUrl}
              className="shrink-0"
            >
              {rendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 mr-1.5" />}
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* ── Poster preview ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-xs md:max-w-sm lg:max-w-md">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Preview (A4 · {selectedTheme === 'dark' ? 'Dark' : 'Light'} ·{' '}
            {THEMES[selectedTheme].label})
          </p>

          {/* Canvas preview wrapper */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border bg-white">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ aspectRatio: `${A4_W}/${A4_H}` }}
            />
          </div>

          {/* Action hints */}
          <div className="mt-4 rounded-lg bg-muted/60 border border-border p-3 space-y-1.5 text-xs text-muted-foreground">
            <p>🖨️ <span className="font-medium text-foreground">Print</span> — opens a print dialog sized to A4.</p>
            <p>💾 <span className="font-medium text-foreground">Download PNG</span> — high-res image for WhatsApp, social media, or framing.</p>
            <p>🎨 <span className="font-medium text-foreground">Change theme/CTA</span> — poster regenerates instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
