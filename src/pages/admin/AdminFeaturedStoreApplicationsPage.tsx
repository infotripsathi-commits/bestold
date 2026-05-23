import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Eye, TrendingUp, Calendar } from 'lucide-react';
import { getAllFeaturedStoreApplications, approveFeaturedStoreApplication, rejectFeaturedStoreApplication } from '@/db/api';
import { toast } from 'sonner';
import type { FeaturedStoreApplication } from '@/types';

export default function AdminFeaturedStoreApplicationsPage() {
  const [applications, setApplications] = useState<FeaturedStoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<FeaturedStoreApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await getAllFeaturedStoreApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (app: FeaturedStoreApplication, actionType: 'approve' | 'reject') => {
    setSelectedApp(app);
    setAction(actionType);
    setAdminNotes('');
    
    if (actionType === 'approve') {
      const today = new Date();
      const start = today.toISOString().split('T')[0];
      const end = new Date(today.getTime() + (app.plan?.duration_days || 30) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      setStartDate(start);
      setEndDate(end);
    }
    
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedApp) return;

    if (action === 'approve' && (!startDate || !endDate)) {
      toast.error('Please set start and end dates');
      return;
    }

    setProcessing(true);
    try {
      if (action === 'approve') {
        await approveFeaturedStoreApplication(
          selectedApp.id,
          new Date(startDate).toISOString(),
          new Date(endDate).toISOString(),
          adminNotes || undefined
        );
        toast.success('Application approved successfully');
      } else {
        await rejectFeaturedStoreApplication(selectedApp.id, adminNotes || undefined);
        toast.success('Application rejected');
      }
      
      setDialogOpen(false);
      await loadApplications();
    } catch (error: any) {
      console.error('Failed to process application:', error);
      toast.error(error.message || 'Failed to process application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      payment_submitted: 'default',
      approved: 'default',
      rejected: 'destructive',
      expired: 'outline',
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      payment_submitted: 'Payment Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
      expired: 'Expired',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Featured Store Applications</h1>
        <p className="text-muted-foreground">
          Review and manage featured store advertising applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Applications
          </CardTitle>
          <CardDescription>
            Approve or reject applications after verifying payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.store?.name}</TableCell>
                      <TableCell>{app.plan?.name}</TableCell>
                      <TableCell className="text-sm">
                        {app.location?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold">₹{app.payment_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {app.payment_reference ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {app.payment_reference}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {app.status === 'payment_submitted' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(app, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(app, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {app.status === 'approved' && (
                            <div className="text-sm text-muted-foreground">
                              {app.start_date && new Date(app.start_date).toLocaleDateString()} - 
                              {app.end_date && new Date(app.end_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'Set the start and end dates for the featured store advertising'
                : 'Provide a reason for rejection (optional)'}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Store:</span>
                  <span className="font-medium">{selectedApp.store?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{selectedApp.plan?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">₹{selectedApp.payment_amount.toLocaleString()}</span>
                </div>
                {selectedApp.payment_reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Ref:</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {selectedApp.payment_reference}
                    </code>
                  </div>
                )}
              </div>

              {action === 'approve' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date *</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes or comments..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={processing}
              variant={action === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
