import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package2, MapPin, Truck, Calendar, Store as StoreIcon, CalendarClock, ShieldX } from 'lucide-react';
import { getOrdersByBuyer } from '@/db/api';
import type { Order } from '@/types';
import { toast } from 'sonner';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await getOrdersByBuyer();
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-4xl">
          <Skeleton className="h-12 w-48 mb-8 bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className={`hover:shadow-lg transition-shadow ${order.order_type === 'store_pickup' ? 'border-amber-300 dark:border-amber-700' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={getStatusColor(order.order_status)}>
                        {order.order_status}
                      </Badge>
                      {order.order_type === 'store_pickup' && (
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1 text-xs">
                          <StoreIcon className="h-3 w-3" /> Store Pickup
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2">{order.products?.title}</h3>
                      <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                      {order.order_type === 'store_pickup' ? (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                            Advance paid: ₹{order.advance_amount?.toLocaleString('en-IN') ?? 500}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pay ₹{((order.product_price ?? 0) - (order.advance_amount ?? 500)).toLocaleString('en-IN')} remaining at store
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-primary mt-1">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Store Pickup specific info */}
                  {order.order_type === 'store_pickup' && (
                    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                      {order.pickup_deadline && (
                        <div className="flex items-start gap-2">
                          <CalendarClock className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                          <div className="text-sm">
                            <p className="font-semibold text-amber-800 dark:text-amber-300">
                              {order.pickup_completed ? 'Pickup Completed ✓' : 'Pickup Deadline'}
                            </p>
                            {!order.pickup_completed && (
                              <p className="text-amber-700 dark:text-amber-400">
                                {new Date(order.pickup_deadline).toLocaleDateString('en-IN', {
                                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <ShieldX className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                        <p className="text-xs text-red-600 dark:text-red-400">
                          The ₹500 advance is non-refundable.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    {order.order_type !== 'store_pickup' && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold">Delivery Address</p>
                          <p className="text-muted-foreground">
                            {order.delivery_address.address_line1}, {order.delivery_address.city}
                          </p>
                        </div>
                      </div>
                    )}

                    {order.tracking_number && order.order_type !== 'store_pickup' && (
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold">Tracking Info</p>
                          <p className="text-muted-foreground">
                            {order.courier_name}: {order.tracking_number}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold">Payment Method</p>
                        <p className="text-muted-foreground uppercase">{order.payment_method}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Package2 className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold">Store</p>
                        <p className="text-muted-foreground">{order.stores?.name}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
