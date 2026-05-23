import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Store, ShoppingCart, AlertCircle } from 'lucide-react';

interface PurchaseOptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  productPrice: number;
  onlineSellingEnabled?: boolean;
  storePickupEnabled?: boolean;
}

export default function PurchaseOptionModal({
  open,
  onOpenChange,
  productId,
  productTitle,
  productPrice,
  onlineSellingEnabled = true,
  storePickupEnabled = true,
}: PurchaseOptionModalProps) {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    onOpenChange(false);
    navigate(`/checkout/${productId}`);
  };

  const handleStorePickup = () => {
    onOpenChange(false);
    navigate(`/store-pickup/${productId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-balance">How would you like to get this?</DialogTitle>
          <DialogDescription className="text-pretty">
            Choose your preferred purchase option for{' '}
            <span className="font-medium text-foreground">{productTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Home Delivery — only shown when online selling is enabled */}
          {onlineSellingEnabled && (
            <button
              onClick={handleBuyNow}
              className="group flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="shrink-0 rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base">Buy Now</span>
                  <Badge variant="secondary" className="text-xs">Home Delivery</Badge>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  Pay the full amount online and get it delivered to your address. Includes delivery charges.
                </p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  ₹{productPrice.toLocaleString('en-IN')} + delivery
                </p>
              </div>
            </button>
          )}

          {/* Store Pickup — only shown when store pickup is enabled */}
          {storePickupEnabled && (
            <button
              onClick={handleStorePickup}
              className="group flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all text-left"
            >
              <div className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                <Store className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base">Store Pickup</span>
                  <Badge className="text-xs bg-amber-500 hover:bg-amber-500 text-white">Advance ₹500</Badge>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  Pay a non-refundable advance of ₹500 to reserve this item. Visit the store within 3 days to pick it up and pay the remaining balance.
                </p>
                <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>The ₹500 advance is non-refundable. If not picked up within 3 days, the item may be resold.</span>
                </div>
              </div>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
