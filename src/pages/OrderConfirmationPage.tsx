import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Package2, MapPin, Store as StoreIcon, CalendarClock, ShieldX } from 'lucide-react';
import { getOrderById } from '@/db/api';
import type { Order } from '@/types';
import { toast } from 'sonner';

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-2xl">
          <Skeleton className="h-64 bg-muted" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Order not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        <Card>
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className={`rounded-full p-4 ${order.order_type === 'store_pickup' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-500/10'}`}>
                {order.order_type === 'store_pickup'
                  ? <StoreIcon className="h-16 w-16 text-amber-500" />
                  : <CheckCircle2 className="h-16 w-16 text-green-500" />}
              </div>
            </div>
            <CardTitle className="text-3xl text-balance">
              {order.order_type === 'store_pickup' ? 'Item Reserved Successfully!' : 'Order Placed Successfully!'}
            </CardTitle>
            <p className="text-muted-foreground mt-2 text-pretty">
              {order.order_type === 'store_pickup'
                ? 'Your ₹500 advance has been received. Visit the store within 3 days to collect your item.'
                : "Thank you for your order. We'll send you a confirmation email shortly."}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-semibold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Type</span>
                <span className="font-semibold capitalize">
                  {order.order_type === 'store_pickup' ? 'Store Pickup' : 'Home Delivery'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Status</span>
                <span className="font-semibold capitalize">{order.order_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold uppercase">{order.payment_method}</span>
              </div>
              {order.order_type === 'store_pickup' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advance Paid</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ₹{order.advance_amount?.toLocaleString('en-IN') ?? 500}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining at Store</span>
                    <span className="font-semibold">
                      ₹{((order.product_price ?? 0) - (order.advance_amount ?? 500)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary">₹{order.total_amount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Store Pickup info box */}
            {order.order_type === 'store_pickup' && order.pickup_deadline && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Visit Store By</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      {new Date(order.pickup_deadline).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldX className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 text-pretty">
                    The ₹500 advance is <strong>non-refundable</strong>. If not collected within 3 days, the seller may resell the item.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">Product Details</h3>
              <div className="flex gap-4 p-4 border rounded-lg">
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                  {order.products?.images && order.products.images.length > 0 ? (
                    <img
                      src={order.products.images[0]}
                      alt={order.products.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{order.products?.title}</h4>
                  <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                  <p className="text-sm text-muted-foreground">₹{order.product_price.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {order.order_type !== 'store_pickup' && (
              <div>
                <h3 className="font-semibold mb-3">Delivery Address</h3>
                <div className="p-4 border rounded-lg space-y-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{order.delivery_address.full_name}</p>
                      <p className="text-sm text-muted-foreground">{order.delivery_address.phone_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.delivery_address.address_line1}
                        {order.delivery_address.address_line2 && `, ${order.delivery_address.address_line2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button asChild className="flex-1">
                <Link to="/my-orders">View My Orders</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
