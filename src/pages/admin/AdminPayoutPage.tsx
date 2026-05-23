import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, Clock, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { getPayouts, releasePayout } from '@/db/api';
import { toast } from 'sonner';
import type { FranchisePayout } from '@/types';

export default function AdminPayoutPage() {
  const [payouts, setPayouts] = useState<FranchisePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<FranchisePayout | null>(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await getPayouts();
      setPayouts(data);
    } catch (error) {
      console.error('Failed to load payouts:', error);
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async () => {
    if (!selectedPayout) return;

    try {
      setProcessing(true);
      await releasePayout(selectedPayout.id, releaseNotes);
      toast.success('Payout released successfully');
      setReleaseDialogOpen(false);
      setReleaseNotes('');
      setSelectedPayout(null);
      await loadPayouts();
    } catch (error) {
      console.error('Failed to release payout:', error);
      toast.error('Failed to release payout');
    } finally {
      setProcessing(false);
    }
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

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const releasedPayouts = payouts.filter(p => p.status === 'released');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payout Management</h1>
          <p className="text-muted-foreground">Manage elite partner store payouts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold">{pendingPayouts.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold">₹{calculateTotalPending().toFixed(2)}</p>
                </div>
                <Wallet className="h-8 w-8 text-yellow-500" />
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
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingPayouts.length})
            </TabsTrigger>
            <TabsTrigger value="released">
              Released ({releasedPayouts.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Payouts */}
          <TabsContent value="pending">
            {pendingPayouts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending payout requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingPayouts.map((payout) => (
                  <Card key={payout.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{payout.stores?.name}</CardTitle>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Payout Amount</Label>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{payout.amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label>Order Number</Label>
                          <p className="font-semibold">#{payout.orders?.order_number}</p>
                        </div>
                        <div>
                          <Label>Store ID</Label>
                          <p className="text-sm text-muted-foreground font-mono">
                            {payout.store_id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedPayout(payout);
                          setReleaseDialogOpen(true);
                        }}
                        className="w-full"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Release Payout
                      </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {releasedPayouts.map((payout) => (
                  <Card key={payout.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{payout.stores?.name}</CardTitle>
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
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount:</span>
                          <span className="font-semibold text-green-600">₹{payout.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Order:</span>
                          <span className="font-semibold">#{payout.orders?.order_number}</span>
                        </div>
                        {payout.notes && (
                          <div className="pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                            <p className="text-sm">{payout.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Release Payout Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Payout</DialogTitle>
            <DialogDescription>
              Confirm payout release to {selectedPayout?.stores?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Store:</span>
                <span className="font-semibold">{selectedPayout?.stores?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-semibold text-green-600">
                  ₹{selectedPayout?.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order:</span>
                <span className="font-semibold">#{selectedPayout?.orders?.order_number}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payout..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReleasePayout}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Release
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
