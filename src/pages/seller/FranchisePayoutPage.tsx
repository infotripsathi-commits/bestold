import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Clock, CheckCircle, AlertCircle, Loader2, DollarSign } from 'lucide-react';
import { getEligiblePayouts, getPayouts, requestPayout, getStoreByUserId } from '@/db/api';
import { toast } from 'sonner';
import type { Order, FranchisePayout, Store } from '@/types';

export default function FranchisePayoutPage() {
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<FranchisePayout[]>([]);
  const [myStore, setMyStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const store = await getStoreByUserId(user.id);
      setMyStore(store);

      if (!store) {
        toast.error('Store not found');
        return;
      }

      if (!store.is_franchise) {
        toast.error('Only franchise stores can access payouts');
        return;
      }

      const [eligible, payoutHistory] = await Promise.all([
        getEligiblePayouts(store.id),
        getPayouts({ store_id: store.id })
      ]);

      setEligibleOrders(eligible);
      setPayouts(payoutHistory);
    } catch (error) {
      console.error('Failed to load payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (orderId: string) => {
    try {
      setRequesting(orderId);
      await requestPayout(orderId);
      toast.success('Payout requested successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to request payout:', error);
      toast.error('Failed to request payout');
    } finally {
      setRequesting(null);
    }
  };

  const calculateTotalEligible = () => {
    return eligibleOrders.reduce((sum, order) => sum + (order.total_amount - order.delivery_charge), 0);
  };

  const calculateTotalPending = () => {
    return payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, payout) => sum + payout.amount, 0);
  };

  const calculateTotalReleased = () => {
    return payouts
      .filter(p => p.status === 'released')
      .reduce((sum, payout) => sum + payout.amount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!myStore?.is_franchise) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <CardTitle>Franchise Required</CardTitle>
              </div>
              <CardDescription>
                Only franchise stores can access the payout system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                To receive payouts for online orders, you need to become an authorized franchise store.
              </p>
              <Button onClick={() => window.location.href = '/become-elite-partner'}>
                Apply for Franchise
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const releasedPayouts = payouts.filter(p => p.status === 'released');

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Franchise Payouts</h1>
          <p className="text-muted-foreground">Manage your earnings from online orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Eligible for Payout</p>
                  <p className="text-2xl font-bold">₹{calculateTotalEligible().toFixed(2)}</p>
                </div>
                <Wallet className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Release</p>
                  <p className="text-2xl font-bold">₹{calculateTotalPending().toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Released</p>
                  <p className="text-2xl font-bold">₹{calculateTotalReleased().toFixed(2)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="eligible" className="space-y-6">
          <TabsList>
            <TabsTrigger value="eligible">
              Eligible ({eligibleOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingPayouts.length})
            </TabsTrigger>
            <TabsTrigger value="released">
              Released ({releasedPayouts.length})
            </TabsTrigger>
          </TabsList>

          {/* Eligible Orders */}
          <TabsContent value="eligible">
            {eligibleOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No eligible payouts at the moment</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Orders become eligible for payout 7 days after delivery
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {eligibleOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                          <CardDescription>
                            Delivered on {order.updated_at ? new Date(order.updated_at).toLocaleDateString() : 'N/A'}
                          </CardDescription>
                        </div>
                        <Badge variant="default">Eligible</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Product</p>
                          <p className="font-semibold">{order.products?.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Order Total</p>
                          <p className="font-semibold">₹{order.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Charge</p>
                          <p className="font-semibold">₹{order.delivery_charge.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Your Payout</p>
                          <p className="font-semibold text-green-600">
                            ₹{(order.total_amount - order.delivery_charge).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRequestPayout(order.id)}
                        disabled={requesting === order.id}
                        className="w-full"
                      >
                        {requesting === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Request Payout
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Payouts */}
          <TabsContent value="pending">
            {pendingPayouts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending payouts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingPayouts.map((payout) => (
                  <Card key={payout.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Payout Request</CardTitle>
                          <CardDescription>
                            Requested on {new Date(payout.requested_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="text-2xl font-bold">₹{payout.amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Order</p>
                          <p className="font-semibold">#{payout.orders?.order_number}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        Waiting for admin approval. Payouts are typically processed within 2-3 business days.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Released Payouts */}
          <TabsContent value="released">
            {releasedPayouts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No released payouts yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {releasedPayouts.map((payout) => (
                  <Card key={payout.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Payout Released</CardTitle>
                          <CardDescription>
                            Released on {payout.released_at ? new Date(payout.released_at).toLocaleDateString() : 'N/A'}
                          </CardDescription>
                        </div>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Released
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="text-2xl font-bold text-green-600">₹{payout.amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Order</p>
                          <p className="font-semibold">#{payout.orders?.order_number}</p>
                        </div>
                      </div>
                      {payout.notes && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Admin Notes:</p>
                          <p className="text-sm">{payout.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
