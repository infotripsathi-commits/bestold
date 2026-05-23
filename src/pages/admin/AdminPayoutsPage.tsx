import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Wallet, IndianRupee, Download, CheckSquare } from 'lucide-react';
import {
  getAllPayoutRequests,
  updatePayoutRequestStatus,
  completePayoutRequest,
  batchApprovePayouts,
  batchCompletePayouts,
  downloadPayoutCSV,
  type PayoutRequest,
} from '@/db/payouts';
import { toast } from 'sonner';

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<(PayoutRequest & { store: any; seller: any })[]>([]);
  const [statusFilter, setStatusFilter] = useState<PayoutRequest['status'] | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<(PayoutRequest & { store: any; seller: any }) | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'complete' | 'batch-approve' | 'batch-complete' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [transactionPrefix, setTransactionPrefix] = useState('BATCH');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  useEffect(() => {
    // Clear selections when filter changes
    setSelectedIds([]);
  }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getAllPayoutRequests(statusFilter === 'all' ? undefined : statusFilter);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load payout requests:', error);
      toast.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map(r => r.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('No requests selected');
      return;
    }

    setSubmitting(true);
    try {
      const batchId = await batchApprovePayouts(selectedIds, adminNotes);

      if (batchId) {
        toast.success(`${selectedIds.length} payout requests approved`);
        setActionDialog(null);
        setSelectedIds([]);
        setAdminNotes('');
        loadRequests();
      } else {
        toast.error('Failed to approve payout requests');
      }
    } catch (error) {
      console.error('Failed to batch approve:', error);
      toast.error('Failed to approve payout requests');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchComplete = async () => {
    if (selectedIds.length === 0) {
      toast.error('No requests selected');
      return;
    }

    if (!transactionPrefix) {
      toast.error('Please provide transaction prefix');
      return;
    }

    setSubmitting(true);
    try {
      const batchId = await batchCompletePayouts(selectedIds, transactionPrefix, adminNotes);

      if (batchId) {
        toast.success(`${selectedIds.length} payouts processed`);
        setActionDialog(null);
        setSelectedIds([]);
        setAdminNotes('');
        setTransactionPrefix('BATCH');
        loadRequests();
      } else {
        toast.error('Failed to process payouts');
      }
    } catch (error) {
      console.error('Failed to batch complete:', error);
      toast.error('Failed to process payouts');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = selectedIds.length > 0
      ? requests.filter(r => selectedIds.includes(r.id))
      : requests;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const filename = `payouts_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadPayoutCSV(dataToExport, filename);
    toast.success(`Exported ${dataToExport.length} payout records`);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const success = await updatePayoutRequestStatus(
        selectedRequest.id,
        'approved',
        adminNotes
      );

      if (success) {
        toast.success('Payout request approved');
        setActionDialog(null);
        setSelectedRequest(null);
        setAdminNotes('');
        loadRequests();
      } else {
        toast.error('Failed to approve payout request');
      }
    } catch (error) {
      console.error('Failed to approve payout request:', error);
      toast.error('Failed to approve payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectedReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      const success = await updatePayoutRequestStatus(
        selectedRequest.id,
        'rejected',
        adminNotes,
        rejectedReason
      );

      if (success) {
        toast.success('Payout request rejected');
        setActionDialog(null);
        setSelectedRequest(null);
        setAdminNotes('');
        setRejectedReason('');
        loadRequests();
      } else {
        toast.error('Failed to reject payout request');
      }
    } catch (error) {
      console.error('Failed to reject payout request:', error);
      toast.error('Failed to reject payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedRequest || !transactionId) {
      toast.error('Please provide transaction ID');
      return;
    }

    setSubmitting(true);
    try {
      const success = await completePayoutRequest(
        selectedRequest.id,
        transactionId,
        adminNotes
      );

      if (success) {
        toast.success('Payout marked as completed');
        setActionDialog(null);
        setSelectedRequest(null);
        setAdminNotes('');
        setTransactionId('');
        loadRequests();
      } else {
        toast.error('Failed to complete payout');
      }
    } catch (error) {
      console.error('Failed to complete payout:', error);
      toast.error('Failed to complete payout');
    } finally {
      setSubmitting(false);
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

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    totalAmount: requests.reduce((sum, r) => sum + r.amount, 0),
  };

  const selectedRequests = requests.filter(r => selectedIds.includes(r.id));
  const selectedTotal = selectedRequests.reduce((sum, r) => sum + r.amount, 0);
  const canBatchApprove = selectedRequests.length > 0 && selectedRequests.every(r => r.status === 'pending');
  const canBatchComplete = selectedRequests.length > 0 && selectedRequests.every(r => r.status === 'approved');

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
          <h1 className="text-3xl font-bold mb-2">Payout Management</h1>
          <p className="text-muted-foreground">
            Manage seller payout requests and transactions
          </p>
          {selectedIds.length > 0 && (
            <p className="text-sm font-medium mt-2">
              {selectedIds.length} selected • Total: ₹{selectedTotal.toLocaleString('en-IN')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canBatchApprove && (
            <Button onClick={() => setActionDialog('batch-approve')}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Batch Approve ({selectedIds.length})
            </Button>
          )}
          {canBatchComplete && (
            <Button onClick={() => setActionDialog('batch-complete')}>
              <Wallet className="mr-2 h-4 w-4" />
              Batch Process ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalAmount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>Review and process seller payout requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payout requests found
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-12">
                      <Checkbox
                        checked={selectedIds.length === requests.length && requests.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Seller</TableHead>
                    <TableHead className="whitespace-nowrap">Store</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap">
                        <Checkbox
                          checked={selectedIds.includes(request.id)}
                          onCheckedChange={() => toggleSelection(request.id)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{request.seller?.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{request.seller?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {request.store?.name || 'N/A'}
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
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog('approve');
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionDialog('reject');
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionDialog('complete');
                              }}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Approve payout of ₹{selectedRequest?.amount.toLocaleString('en-IN')} to {selectedRequest?.seller?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>
              Reject payout of ₹{selectedRequest?.amount.toLocaleString('en-IN')} to {selectedRequest?.seller?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectedReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectedReason"
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                placeholder="Explain why this request is being rejected"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes2">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes2"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              {submitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog === 'complete'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment of ₹{selectedRequest?.amount.toLocaleString('en-IN')} to {selectedRequest?.seller?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID *</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction/reference ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes3">Notes (Optional)</Label>
              <Textarea
                id="adminNotes3"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about the payment"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={submitting}>
              {submitting ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Approve Dialog */}
      <Dialog open={actionDialog === 'batch-approve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Approve Payouts</DialogTitle>
            <DialogDescription>
              Approve {selectedIds.length} payout requests totaling ₹{selectedTotal.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batchAdminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="batchAdminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for all selected requests"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleBatchApprove} disabled={submitting}>
              {submitting ? 'Approving...' : `Approve ${selectedIds.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Complete Dialog */}
      <Dialog open={actionDialog === 'batch-complete'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Process Payouts</DialogTitle>
            <DialogDescription>
              Process {selectedIds.length} payouts totaling ₹{selectedTotal.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transactionPrefix">Transaction Prefix *</Label>
              <Input
                id="transactionPrefix"
                value={transactionPrefix}
                onChange={(e) => setTransactionPrefix(e.target.value)}
                placeholder="e.g., BATCH, PAY"
              />
              <p className="text-xs text-muted-foreground">
                Transaction IDs will be generated as: {transactionPrefix}_[request_id]
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchCompleteNotes">Notes (Optional)</Label>
              <Textarea
                id="batchCompleteNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for all transactions"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleBatchComplete} disabled={submitting}>
              {submitting ? 'Processing...' : `Process ${selectedIds.length} Payouts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
