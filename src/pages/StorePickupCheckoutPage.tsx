import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package2,
  Store,
  AlertCircle,
  Copy,
  CheckCircle,
  QrCode,
  CalendarClock,
  ShieldX,
  Clock3,
} from 'lucide-react';
import { getProduct, getPaymentSettings, getStore, createStorePickupOrder, STORE_PICKUP_ADVANCE_AMOUNT } from '@/db/api';
import type { Product, PaymentSettings, Store as StoreType } from '@/types';
import { toast } from 'sonner';

export default function StorePickupCheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [sellerStore, setSellerStore] = useState<StoreType | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      navigate('/login');
      return;
    }
    if (productId) {
      loadData();
    }
  }, [user, productId, navigate]);

  const loadData = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const [productData, settings] = await Promise.all([
        getProduct(productId),
        getPaymentSettings(),
      ]);
      if (!productData) {
        toast.error('Product not found');
        navigate('/');
        return;
      }
      setProduct(productData);
      setPaymentSettings(settings);
      // Load seller store for store-specific payment QR / UPI
      if (productData.store_id) {
        const storeData = await getStore(productData.store_id);
        setSellerStore(storeData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load product details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    // Prefer store's own UPI; fall back to platform setting
    const upiId = sellerStore?.pickup_upi_id || paymentSettings?.upi_id || 'platform@upi';
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Resolved payment info: store-specific takes priority over platform default
  const activeQrUrl = sellerStore?.pickup_qr_code_url || paymentSettings?.qr_code_url || null;
  const activeUpiId = sellerStore?.pickup_upi_id || paymentSettings?.upi_id || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !productId) return;

    if (!paymentReference.trim()) {
      toast.error('Please enter UPI transaction ID after paying ₹500');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please acknowledge that the advance is non-refundable');
      return;
    }

    try {
      setSubmitting(true);
      const order = await createStorePickupOrder({
        product_id: productId,
        payment_reference: paymentReference.trim(),
      });
      toast.success('Store pickup reserved!', {
        description: 'Visit the store within 3 days to collect your item.',
      });
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: unknown) {
      console.error('Failed to create store pickup order:', error);
      const msg = error instanceof Error ? error.message : 'Failed to reserve item';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pickupDeadlineDate = new Date();
  pickupDeadlineDate.setDate(pickupDeadlineDate.getDate() + 3);
  const deadlineStr = pickupDeadlineDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-4xl">
          <Skeleton className="h-10 w-64 mb-8 bg-muted" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96 bg-muted" />
            <Skeleton className="h-96 bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Product not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
            <Store className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">Store Pickup — Reserve Item</h1>
            <p className="text-sm text-muted-foreground">Pay ₹500 advance to hold this item for 3 days</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: How it works + Payment */}
            <div className="space-y-6">

              {/* How it works */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">How Store Pickup Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                    <div>
                      <p className="font-medium text-sm">Pay ₹500 advance</p>
                      <p className="text-xs text-muted-foreground">Send ₹500 via UPI to reserve the item immediately.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">2</div>
                    <div>
                      <p className="font-medium text-sm">Visit the store within 3 days</p>
                      <p className="text-xs text-muted-foreground">
                        Come to the store by <span className="font-semibold text-foreground">{deadlineStr}</span>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">3</div>
                    <div>
                      <p className="font-medium text-sm">Pay remaining balance & collect</p>
                      <p className="text-xs text-muted-foreground">
                        Pay <span className="font-semibold text-foreground">₹{(product.price - STORE_PICKUP_ADVANCE_AMOUNT).toLocaleString('en-IN')}</span> remaining at the store and take your item.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Important notices */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <ShieldX className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive font-medium">
                        The ₹500 advance is strictly non-refundable once paid.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        If you don't visit within 3 days, the seller may resell the item to another buyer.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <CalendarClock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Your pickup deadline: <span className="font-semibold text-foreground">{deadlineStr}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pay ₹500 Advance via UPI</CardTitle>
                  <CardDescription>Send exactly ₹500 to the UPI ID below</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* QR Code — store's own if available, else platform default */}
                  {activeQrUrl && (
                    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-semibold">Scan QR Code to Pay ₹500</Label>
                      </div>
                      <img
                        src={activeQrUrl}
                        alt="Payment QR Code"
                        className="w-44 h-44 object-contain border-2 border-border rounded-lg"
                      />
                      {sellerStore?.pickup_qr_code_url && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Pay directly to <span className="font-medium text-foreground">{sellerStore.name}</span>
                        </p>
                      )}
                      {!sellerStore?.pickup_qr_code_url && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Scan with any UPI app
                        </p>
                      )}
                    </div>
                  )}

                  {/* UPI ID */}
                  {activeUpiId && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {activeQrUrl ? 'Or pay to UPI ID' : 'Pay to UPI ID'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={activeUpiId}
                          readOnly
                          className="font-mono text-base"
                        />
                        <Button type="button" size="icon" variant="outline" onClick={handleCopyUpi}>
                          {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Fallback when no payment info configured at all */}
                  {!activeQrUrl && !activeUpiId && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center">
                      <QrCode className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Payment QR coming soon</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        The seller will share payment details. Enter the transaction ID after paying.
                      </p>
                    </div>
                  )}

                  {/* Amount reminder */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Amount to send:</span>
                    <span className="text-xl font-bold text-amber-700 dark:text-amber-400">₹500</span>
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-1">
                    <Label htmlFor="payment-ref">UPI Transaction ID *</Label>
                    <Input
                      id="payment-ref"
                      placeholder="Enter transaction ID after paying ₹500"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Complete the UPI payment of ₹500 first, then enter the transaction ID here.
                    </p>
                  </div>

                  {/* Agree checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <span className="text-xs text-muted-foreground text-pretty group-hover:text-foreground transition-colors">
                      I understand that the ₹500 advance is <strong>non-refundable</strong> and that I must visit the store by{' '}
                      <strong>{deadlineStr}</strong> to collect the item, or it may be resold.
                    </span>
                  </label>
                </CardContent>
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Reservation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product */}
                  <div className="flex gap-3">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                      {product.images?.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2 text-sm">{product.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Full price: ₹{product.price.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground">{product.store?.name}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Full product price</span>
                      <span>₹{product.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-primary font-medium">
                      <span>Advance (pay now)</span>
                      <span>₹{STORE_PICKUP_ADVANCE_AMOUNT.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Remaining (pay at store)</span>
                      <span>₹{(product.price - STORE_PICKUP_ADVANCE_AMOUNT).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-base font-bold">
                    <span>Pay Now</span>
                    <span className="text-amber-600 dark:text-amber-400">₹500</span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" /> Pickup Deadline
                    </p>
                    <p>{deadlineStr}</p>
                  </div>
                </CardContent>

                <CardFooter className="flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                    disabled={submitting || !paymentReference.trim() || !agreedToTerms}
                  >
                    {submitting ? 'Reserving...' : 'Reserve with ₹500 Advance'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/products/${productId}`)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
