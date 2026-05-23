import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, Plus, Clock, CheckCircle, XCircle, IndianRupee, Lock, AlertCircle } from 'lucide-react';
import {
  getSellerPayoutSummary,
  getSellerPayoutRequests,
  getSellerOrdersWithPayoutStatus,
  createPayoutRequest,
  cancelPayoutRequest,
  type PayoutRequest,
  type PayoutSummary,
  type SellerOrderPayoutStatus,
} from '@/db/payouts';
import { getStoreByUserId } from '@/db/api';
import type { Store } from '@/types';
import { toast } from 'sonner';

const MINIMUM_PAYOUT = 500;

export default function SellerPayoutsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [orders, setOrders] = useState<SellerOrderPayoutStatus[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'upi' | 'paypal' | 'other'>('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) return;
      
      const [summaryData, requestsData, storeData, ordersData] = await Promise.all([
        getSellerPayoutSummary(),
        getSellerPayoutRequests(),
        getStoreByUserId(user.id),
        getSellerOrdersWithPayoutStatus(),
      ]);
      setSummary(summaryData);
      setRequests(requestsData);
      setStore(storeData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load payout data:', error);
      toast.error('Failed to load payout information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!store) {
      toast.error('Store not found');
      return;
    }

    const requestAmount = parseFloat(amount);

    if (!requestAmount || requestAmount < MINIMUM_PAYOUT) {
      toast.error(`Minimum payout amount is ₹${MINIMUM_PAYOUT}`);
      return;
    }

    if (requestAmount > (summary?.available_balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    if (paymentMethod === 'bank_transfer' && (!bankName || !accountNumber || !ifscCode || !accountHolderName)) {
      toast.error('Please fill in all bank details');
      return;
    }

    if (paymentMethod === 'upi' && !upiId) {
      toast.error('Please enter UPI ID');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createPayoutRequest(
        store.id,
        requestAmount,
        paymentMethod,
        {
          bankName,
          accountNumber,
          ifscCode,
          upiId,
          accountHolderName,
        },
        notes
      );

      if (result) {
        toast.success('Payout request submitted successfully');
        setDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error('Failed to submit payout request');
      }
    } catch (error) {
      console.error('Failed to submit payout request:', error);
      toast.error('Failed to submit payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('bank_transfer');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setUpiId('');
    setAccountHolderName('');
    setNotes('');
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this payout request?')) return;

    const success = await cancelPayoutRequest(requestId);
    if (success) {
      toast.success('Payout request cancelled');
      loadData();
    } else {
      toast.error('Failed to cancel payout request');
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    const variants: Record<PayoutRequest['status'], { variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
      pending: { variant: 'outline', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      completed: { variant: 'secondary', icon: CheckCircle },
    };
    const { variant, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="capitalize">
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-48 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payouts</h1>
          <p className="text-muted-foreground">
            Manage your earnings and payout requests
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={(summary?.available_balance || 0) < MINIMUM_PAYOUT}>
              <Plus className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Minimum payout amount: ₹{MINIMUM_PAYOUT}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${MINIMUM_PAYOUT}`}
                  max={summary?.available_balance || 0}
                />
                <p className="text-sm text-muted-foreground">
                  Available balance: ₹{(summary?.available_balance || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                    <Input
                      id="accountHolderName"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Enter account holder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'upi' && (
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID *</Label>
                  <Input
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(summary?.total_earnings || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From delivered orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(summary?.total_payouts || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(summary?.pending_payouts || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₹{(summary?.available_balance || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to withdraw (past return period)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ₹{(summary?.locked_balance || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In 7-day return period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Return Policy Info */}
      {(summary?.locked_balance || 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Return Policy Protection
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ₹{(summary?.locked_balance || 0).toLocaleString('en-IN')} is currently locked in the 7-day return period. 
                  This amount will become available for payout after the return period expires for each order.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-amber-600 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/30"
                  onClick={() => setOrdersDialogOpen(true)}
                >
                  View Order Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>View and manage your payout requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payout requests yet
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        ₹{request.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap capitalize">
                        {request.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {request.transaction_id || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRequest(request.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Dialog */}
      <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Payout Status</DialogTitle>
            <DialogDescription>
              Track which orders are eligible for payout and return period status
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No delivered orders found
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Order #</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Delivered</TableHead>
                      <TableHead className="whitespace-nowrap">Return Period Ends</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Days Until Eligible</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell className="whitespace-nowrap font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(order.delivered_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {order.return_period_ends_at 
                            ? new Date(order.return_period_ends_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {order.is_eligible_for_payout ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Eligible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-600 text-amber-600">
                              <Lock className="mr-1 h-3 w-3" />
                              Locked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {order.is_eligible_for_payout ? (
                            <span className="text-green-600 font-medium">Available Now</span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              {order.days_until_eligible} {order.days_until_eligible === 1 ? 'day' : 'days'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOrdersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
