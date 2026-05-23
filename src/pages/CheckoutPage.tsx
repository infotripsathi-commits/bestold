import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package2, MapPin, AlertCircle, CreditCard, Smartphone, Building2, Banknote, Copy, CheckCircle, QrCode } from 'lucide-react';
import { getProduct, createOrder, getPaymentSettings, getDeliveryCharge } from '@/db/api';
import type { Product, PaymentMethod, PaymentSettings } from '@/types';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(50); // Default value
  const [deliveryAddress, setDeliveryAddress] = useState({
    full_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    if (!user) {
      navigate('/login');
      return;
    }
    if (productId) {
      loadProduct();
      loadPaymentSettings();
      loadDeliveryCharge();
    }
  }, [user, productId, navigate]);

  const loadPaymentSettings = async () => {
    try {
      const settings = await getPaymentSettings();
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  };

  const loadDeliveryCharge = async () => {
    try {
      const charge = await getDeliveryCharge();
      setDeliveryCharge(charge);
    } catch (error) {
      console.error('Failed to load delivery charge:', error);
      // Keep default value of 50
    }
  };

  const handleCopyUpi = () => {
    const upiId = paymentSettings?.upi_id || 'platform@upi';
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const loadProduct = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const productData = await getProduct(productId);
      
      if (!productData) {
        toast.error('Product not found');
        navigate('/');
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !productId) return;

    // Validate delivery address
    if (!deliveryAddress.full_name || !deliveryAddress.phone_number || 
        !deliveryAddress.address_line1 || !deliveryAddress.city || 
        !deliveryAddress.state || !deliveryAddress.pincode) {
      toast.error('Please fill in all required delivery address fields');
      return;
    }

    // Validate payment reference for UPI
    if (paymentMethod === 'upi' && !paymentReference.trim()) {
      toast.error('Please enter UPI transaction ID');
      return;
    }

    try {
      setSubmitting(true);
      const order = await createOrder({
        product_id: productId,
        quantity,
        delivery_address: deliveryAddress,
        payment_method: paymentMethod
      });

      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: unknown) {
      console.error('Failed to create order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-4xl">
          <Skeleton className="h-12 w-48 mb-8 bg-muted" />
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

  const subtotal = product.price * quantity;
  const total = subtotal + deliveryCharge;

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Delivery Address Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Address</CardTitle>
                  <CardDescription>Enter your delivery details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={deliveryAddress.full_name}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={deliveryAddress.phone_number}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      value={deliveryAddress.address_line1}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address_line1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={deliveryAddress.address_line2}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address_line2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={deliveryAddress.pincode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>All payments are processed through platform UPI for buyer protection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Platform UPI Information */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Secure Payment via Platform UPI</h4>
                        <p className="text-sm text-muted-foreground">
                          Make payment to our platform UPI ID. Your payment is held securely until delivery is confirmed.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* QR Code Section */}
                      {paymentSettings?.qr_code_url && (
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <QrCode className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Scan QR Code to Pay</Label>
                          </div>
                          <img
                            src={paymentSettings.qr_code_url}
                            alt="Payment QR Code"
                            className="w-48 h-48 object-contain border-2 border-border rounded-lg"
                          />
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Scan with any UPI app to make payment
                          </p>
                        </div>
                      )}

                      {/* UPI ID Section */}
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {paymentSettings?.qr_code_url ? 'Or Pay Manually to UPI ID' : 'Platform UPI ID'}
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={paymentSettings?.upi_id || 'platform@upi'}
                            readOnly
                            className="font-mono text-base"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={handleCopyUpi}
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Transaction ID Input */}
                      <div>
                        <Label htmlFor="payment-ref">Payment Reference / UPI Transaction ID *</Label>
                        <Input
                          id="payment-ref"
                          placeholder="Enter UPI transaction ID after payment"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          required
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Complete the UPI payment and enter the transaction ID here
                        </p>
                      </div>
                    </div>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5" />
                        <span>UPI (Recommended)</span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer opacity-50">
                      <RadioGroupItem value="card" id="card" disabled />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5" />
                        <span>Credit/Debit Card (Coming Soon)</span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer opacity-50">
                      <RadioGroupItem value="netbanking" id="netbanking" disabled />
                      <Label htmlFor="netbanking" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="h-5 w-5" />
                        <span>Net Banking (Coming Soon)</span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer opacity-50">
                      <RadioGroupItem value="cod" id="cod" disabled />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="h-5 w-5" />
                        <span>Cash on Delivery (Coming Soon)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-2">{product.title}</h3>
                      <p className="text-sm text-muted-foreground">₹{product.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{product.store?.name}</span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-semibold">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Charge</span>
                      <span className="font-semibold">₹{deliveryCharge.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Processing...' : 'Place Order'}
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
