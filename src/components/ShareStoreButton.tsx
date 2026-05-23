import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, Facebook, Twitter, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Store } from '@/types';

interface ShareStoreButtonProps {
  store: Store;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export default function ShareStoreButton({
  store,
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  showText = true,
}: ShareStoreButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Validate store object
  if (!store || !store.id) {
    console.error('ShareStoreButton: Invalid store object', store);
    return null;
  }

  // Generate store URL
  const storeUrl = `${window.location.origin}/stores/${store.id}`;
  
  // Share text
  const shareTitle = `Check out ${store.name || 'this store'} on BestOld`;
  const shareText = store.description 
    ? `${store.name || 'Store'} - ${store.description.substring(0, 100)}${store.description.length > 100 ? '...' : ''}`
    : `Check out ${store.name || 'this store'} on BestOld - Your trusted second-hand marketplace`;

  // Check if Web Share API is available
  const canUseWebShare = typeof navigator !== 'undefined' && navigator.share;

  const handleNativeShare = async () => {
    if (!canUseWebShare) {
      console.log('Web Share API not available, opening dialog instead');
      setOpen(true);
      return;
    }

    try {
      console.log('Attempting to share:', { title: shareTitle, text: shareText, url: storeUrl });
      
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: storeUrl,
      });
      
      console.log('Share successful');
      toast.success('Store shared successfully!');
      setOpen(false);
    } catch (error: any) {
      console.error('Share error:', error);
      
      // User cancelled - don't show error
      if (error.name === 'AbortError') {
        console.log('User cancelled share');
        return;
      }
      
      // Other errors - show dialog as fallback
      console.log('Share failed, opening dialog as fallback');
      setOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      console.log('Copying link:', storeUrl);
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success('Store link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      
      // Fallback: try to select the text
      try {
        const input = document.getElementById('store-url') as HTMLInputElement;
        if (input) {
          input.select();
          document.execCommand('copy');
          setCopied(true);
          toast.success('Store link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast.error('Failed to copy link. Please select and copy manually.');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('Failed to copy link. Please select and copy manually.');
      }
    }
  };

  const handleShareVia = (platform: string) => {
    try {
      console.log('Sharing via:', platform);
      
      const encodedUrl = encodeURIComponent(storeUrl);
      const encodedText = encodeURIComponent(shareText);
      const encodedTitle = encodeURIComponent(shareTitle);

      let shareUrl = '';

      switch (platform) {
        case 'whatsapp':
          // Use whatsapp:// protocol for better mobile compatibility
          const whatsappText = `${encodedText}%20${encodedUrl}`;
          shareUrl = `whatsapp://send?text=${whatsappText}`;
          
          // Try to open WhatsApp app
          const whatsappWindow = window.open(shareUrl, '_blank');
          
          // If the app didn't open (desktop or app not installed), use web version
          setTimeout(() => {
            if (!whatsappWindow || whatsappWindow.closed) {
              window.open(`https://web.whatsapp.com/send?text=${whatsappText}`, '_blank', 'noopener,noreferrer');
            }
          }, 500);
          
          toast.success('Opening WhatsApp...');
          return; // Early return to avoid the generic window.open below
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
          break;
        default:
          console.error('Unknown platform:', platform);
          return;
      }

      console.log('Opening share URL:', shareUrl);
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opening ${platform}...`);
    } catch (error) {
      console.error('Error sharing via platform:', error);
      toast.error(`Failed to open ${platform}`);
    }
  };

  const buttonContent = (
    <>
      {showIcon && <Share2 className="h-4 w-4" />}
      {showText && <span>Share Store</span>}
    </>
  );

  // Always use dialog approach for consistency and better UX
  // Native share can be unreliable on some devices
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {buttonContent}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {store.name || 'Store'}</DialogTitle>
          <DialogDescription>
            Share this store with your friends and family
          </DialogDescription>
        </DialogHeader>
        <ShareDialogContent
          storeUrl={storeUrl}
          copied={copied}
          onCopyLink={handleCopyLink}
          onShareVia={handleShareVia}
        />
      </DialogContent>
    </Dialog>
  );
}

// Separate component for dialog content to avoid duplication
function ShareDialogContent({
  storeUrl,
  copied,
  onCopyLink,
  onShareVia,
}: {
  storeUrl: string;
  copied: boolean;
  onCopyLink: () => void;
  onShareVia: (platform: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Copy Link Section */}
      <div className="space-y-2">
        <Label htmlFor="store-url">Store Link</Label>
        <div className="flex gap-2">
          <Input
            id="store-url"
            value={storeUrl}
            readOnly
            className="flex-1"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onCopyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy link</span>
          </Button>
        </div>
      </div>

      {/* Share via Social Media */}
      <div className="space-y-2">
        <Label>Share via</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => onShareVia('whatsapp')}
          >
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            WhatsApp
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => onShareVia('facebook')}
          >
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Facebook
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => onShareVia('twitter')}
          >
            <Twitter className="h-4 w-4 mr-2 text-sky-500" />
            Twitter
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => onShareVia('telegram')}
          >
            <svg
              className="h-4 w-4 mr-2 text-blue-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Telegram
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start col-span-2"
            onClick={() => onShareVia('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}
