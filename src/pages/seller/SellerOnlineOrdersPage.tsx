import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package2, MapPin, Phone, User, Truck, AlertCircle, Clock, CheckCircle, Calendar, ChevronDown, ChevronUp, Store as StoreIcon, CalendarClock, ShieldAlert } from 'lucide-react';
import { getOrdersBySeller, updateOrderStatus, addTrackingInfo, getStoreByUserId, updatePayoutEligibility, markPickupCompleted } from '@/db/api';
import type { Order, OrderStatus, Store } from '@/types';
import { toast } from 'sonner';
import OrderStatusWorkflow from '@/components/OrderStatusWorkflow';

export default function SellerOnlineOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load data once user is confirmed
    // The page will check subscription status and show appropriate message
    if (user) {
      loadData();
    }
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Update payout eligibility before loading orders (non-blocking)
      try {
        await updatePayoutEligibility();
      } catch (payoutError) {
        console.error('Failed to update payout eligibility:', payoutError);
        // Continue loading orders even if payout update fails
      }
      
      const [ordersData, storeData] = await Promise.all([
        getOrdersBySeller(),
        getStoreByUserId(user.id)
      ]);

      console.log('Orders loaded:', ordersData.length, 'orders');
      setOrders(ordersData);
      setStore(storeData);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
      
      // If marked as delivered, show info about return period
      if (newStatus === 'delivered') {
        toast.info('7-day return period started. Payout will be eligible after this period.');
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const calculateReturnPeriodStatus = (order: Order) => {
    if (order.order_status !== 'delivered' || !order.return_period_ends_at) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(order.return_period_ends_at);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
      return {
        status: 'active',
        daysRemaining,
        message: `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
      };
    } else {
      return {
        status: 'expired',
        daysRemaining: 0,
        message: 'Return period ended'
      };
    }
  };

  const handleAddTracking = async () => {
    if (!selectedOrder || !trackingNumber || !courierName) {
      toast.error('Please fill in all tracking details');
      return;
    }

    try {
      setSubmitting(true);
      await addTrackingInfo(selectedOrder.id, {
        tracking_number: trackingNumber,
        courier_name: courierName
      });
      toast.success('Tracking information added successfully');
      setTrackingDialogOpen(false);
      setTrackingNumber('');
      setCourierName('');
      setSelectedOrder(null);
      loadData();
    } catch (error) {
      console.error('Failed to add tracking info:', error);
      toast.error('Failed to add tracking information');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus: OrderStatus): string | null => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return null;
    
    const labels: Record<OrderStatus, string> = {
      pending: '',
      confirmed: 'Confirm Order',
      shipped: 'Mark as Shipped',
      delivered: 'Mark as Delivered',
      cancelled: '',
    };
    return labels[nextStatus];
  };

  const handleQuickStatusUpdate = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    // If moving to shipped, require tracking info
    if (nextStatus === 'shipped') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setTrackingDialogOpen(true);
      }
      return;
    }

    await handleStatusUpdate(orderId, nextStatus);
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

  const getPickupDeadlineInfo = (order: Order) => {
    if (order.order_type !== 'store_pickup' || !order.pickup_deadline) return null;
    const deadline = new Date(order.pickup_deadline);
    const now = new Date();
    const hoursLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    const isExpired = deadline < now;
    const isUrgent = !isExpired && hoursLeft <= 24;
    return { deadline, hoursLeft, isExpired, isUrgent };
  };

  const handleMarkPickupCompleted = async (orderId: string) => {
    try {
      await markPickupCompleted(orderId);
      toast.success('Pickup marked as completed');
      loadData();
    } catch (error) {
      console.error('Failed to mark pickup completed:', error);
      toast.error('Failed to update pickup status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8 bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Online Orders</h1>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground">
                You haven't received any online orders yet. Orders will appear here once customers purchase from your store.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className={`hover:shadow-lg transition-shadow ${order.order_type === 'store_pickup' ? 'border-amber-300 dark:border-amber-700' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                        <Badge className={getStatusColor(order.order_status)}>
                          {order.order_status}
                        </Badge>
                        {order.order_type === 'store_pickup' && (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
                            <StoreIcon className="h-3 w-3" /> Store Pickup
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                      {/* Pickup deadline warning */}
                      {order.order_type === 'store_pickup' && (() => {
                        const info = getPickupDeadlineInfo(order);
                        if (!info || order.pickup_completed) return null;
                        return (
                          <div className={`mt-2 flex items-center gap-2 text-sm rounded-lg px-3 py-1.5 w-fit ${info.isExpired ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' : info.isUrgent ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'}`}>
                            {info.isExpired ? <ShieldAlert className="h-4 w-4 shrink-0" /> : <CalendarClock className="h-4 w-4 shrink-0" />}
                            {info.isExpired
                              ? 'Pickup deadline passed — you may resell this item'
                              : `Customer must pick up by ${info.deadline.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} (${info.hoursLeft}h left)`}
                          </div>
                        );
                      })()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="shrink-0"
                    >
                      {expandedOrders.has(order.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          View Details
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Compact Workflow - Always Visible */}
                  <div className="mt-4">
                    <OrderStatusWorkflow
                      currentStatus={order.order_status}
                      createdAt={order.created_at}
                      confirmedAt={order.confirmed_at}
                      shippedAt={order.shipped_at}
                      deliveredAt={order.delivered_at}
                      cancelledAt={order.cancelled_at}
                      compact
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Actions */}
                  {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                    <div className="flex flex-wrap gap-2">
                      {/* For store pickup orders: show "Mark Picked Up" instead of delivery workflow */}
                      {order.order_type === 'store_pickup' ? (
                        !order.pickup_completed && (
                          <Button
                            size="sm"
                            className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => handleMarkPickupCompleted(order.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Picked Up
                          </Button>
                        )
                      ) : (
                        <>
                          {getNextStatusLabel(order.order_status) && (
                            <Button
                              onClick={() => handleQuickStatusUpdate(order.id, order.order_status)}
                              size="sm"
                              className="flex-1 md:flex-none"
                            >
                              {getNextStatusLabel(order.order_status)}
                            </Button>
                          )}
                          {order.order_status === 'confirmed' && !order.tracking_number && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setTrackingDialogOpen(true);
                              }}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Add Tracking
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedOrders.has(order.id) && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Full Workflow Visualization */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-4 text-sm">Order Progress</h4>
                        <OrderStatusWorkflow
                          currentStatus={order.order_status}
                          createdAt={order.created_at}
                          confirmedAt={order.confirmed_at}
                          shippedAt={order.shipped_at}
                          deliveredAt={order.delivered_at}
                          cancelledAt={order.cancelled_at}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                    {/* Product Info */}
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
                      <div className="flex-1">
                        <h3 className="font-semibold">{order.products?.title}</h3>
                        <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Buyer Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold">Buyer Details</p>
                          <p className="text-muted-foreground">{order.delivery_address.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <p className="text-muted-foreground">{order.delivery_address.phone_number}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="p-4 bg-muted rounded-lg">
                    {order.order_type === 'store_pickup' ? (
                      <div className="flex items-start gap-2">
                        <StoreIcon className="h-4 w-4 mt-1 text-amber-600 shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Store Pickup Order</p>
                          <p className="text-muted-foreground">
                            Advance paid: ₹{order.advance_amount?.toLocaleString('en-IN') ?? 500} (non-refundable)
                          </p>
                          {order.advance_payment_reference && (
                            <p className="text-muted-foreground text-xs">Ref: {order.advance_payment_reference}</p>
                          )}
                          <p className={`mt-1 font-medium text-xs ${order.pickup_completed ? 'text-green-600' : 'text-amber-600'}`}>
                            {order.pickup_completed
                              ? '✓ Picked up by customer'
                              : `Remaining to collect at store: ₹${((order.product_price ?? 0) - (order.advance_amount ?? 500)).toLocaleString('en-IN')}`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Delivery Address</p>
                          <p className="text-muted-foreground">
                            {order.delivery_address.address_line1}
                            {order.delivery_address.address_line2 && `, ${order.delivery_address.address_line2}`}
                          </p>
                          <p className="text-muted-foreground">
                            {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tracking Info */}
                  {order.tracking_number && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold mb-1">Tracking Information</p>
                          <p className="text-muted-foreground">
                            Courier: {order.courier_name}
                          </p>
                          <p className="text-muted-foreground">
                            Tracking Number: {order.tracking_number}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Return Period & Payout Status */}
                  {order.order_status === 'delivered' && order.return_period_ends_at && (() => {
                    const periodStatus = calculateReturnPeriodStatus(order);
                    return periodStatus && (
                      <div className={`p-4 rounded-lg border ${
                        periodStatus.status === 'active' 
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' 
                          : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      }`}>
                        <div className="flex items-start gap-3">
                          {periodStatus.status === 'active' ? (
                            <Clock className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-sm">
                                {periodStatus.status === 'active' ? 'Return Period Active' : 'Return Period Ended'}
                              </p>
                              <Badge variant={periodStatus.status === 'active' ? 'secondary' : 'default'}>
                                {periodStatus.message}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {periodStatus.status === 'active' 
                                ? 'Payment is held securely. Payout will be available after the return period.'
                                : 'You can now request payout for this order from the Payouts page.'
                              }
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Ends: {new Date(order.return_period_ends_at).toLocaleDateString()} at{' '}
                                {new Date(order.return_period_ends_at).toLocaleTimeString()}
                              </span>
                            </div>
                            {order.payout_status && (
                              <div className="mt-2 pt-2 border-t">
                                <span className="text-xs font-medium">Payout Status: </span>
                                <Badge variant={
                                  order.payout_status === 'eligible' ? 'default' :
                                  order.payout_status === 'pending' ? 'secondary' :
                                  'outline'
                                } className="text-xs">
                                  {order.payout_status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                      {/* Manual Status Change */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Select
                          value={order.order_status}
                          onValueChange={(value) => handleStatusUpdate(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        {!order.tracking_number && order.order_status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setTrackingDialogOpen(true);
                            }}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Add Tracking
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tracking Dialog */}
        <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tracking Information</DialogTitle>
              <DialogDescription>
                Enter the courier details and tracking number for this order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courier">Courier Name *</Label>
                <Input
                  id="courier"
                  placeholder="e.g., Blue Dart, DTDC, India Post"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number *</Label>
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setTrackingDialogOpen(false);
                  setTrackingNumber('');
                  setCourierName('');
                  setSelectedOrder(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTracking} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Tracking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
