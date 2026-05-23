import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Award, 
  Check, 
  X, 
  Clock, 
  Loader2, 
  Store as StoreIcon, 
  ShoppingCart,
  CheckSquare,
  Square,
  BarChart3
} from 'lucide-react';
import {
  getFranchiseApplications,
  approveFranchiseApplication,
  rejectFranchiseApplication,
  getAllFranchisePlans,
  createFranchisePlan,
  updateFranchisePlan,
  deleteFranchisePlan,
  toggleStoreOnlineSelling,
  bulkToggleStoreOnlineSelling,
  getAllFranchiseStoresForAdmin
} from '@/db/api';
import { toast } from 'sonner';
import FranchiseBadge from '@/components/FranchiseBadge';
import type { FranchiseApplication, FranchisePlan } from '@/types';

export default function AdminFranchisePage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [plans, setPlans] = useState<FranchisePlan[]>([]);
  const [franchiseStores, setFranchiseStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<FranchiseApplication | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Bulk selection state
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable'>('enable');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsData, plansData, storesData] = await Promise.all([
        getFranchiseApplications(),
        getAllFranchisePlans(),
        getAllFranchiseStoresForAdmin()
      ]);
      setApplications(appsData);
      setPlans(plansData);
      setFranchiseStores(storesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load elite partner data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      setProcessing(true);
      await approveFranchiseApplication(applicationId);
      toast.success('Elite Partner application approved!');
      await loadData();
    } catch (error) {
      console.error('Failed to approve application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await rejectFranchiseApplication(selectedApp.id, rejectionReason);
      toast.success('Application rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedApp(null);
      await loadData();
    } catch (error) {
      console.error('Failed to reject application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleOnlineSelling = async (storeId: string, currentStatus: boolean) => {
    try {
      await toggleStoreOnlineSelling(storeId, !currentStatus);
      toast.success(`Online selling ${!currentStatus ? 'enabled' : 'disabled'}`);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle online selling:', error);
      toast.error('Failed to update online selling status');
    }
  };

  // Bulk selection handlers
  const handleSelectStore = (storeId: string, checked: boolean) => {
    if (checked) {
      setSelectedStoreIds(prev => [...prev, storeId]);
    } else {
      setSelectedStoreIds(prev => prev.filter(id => id !== storeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all franchise stores
      const allStoreIds = franchiseStores.map(store => store.id);
      setSelectedStoreIds(allStoreIds);
    } else {
      setSelectedStoreIds([]);
    }
  };

  const handleBulkAction = (action: 'enable' | 'disable') => {
    if (selectedStoreIds.length === 0) {
      toast.error('Please select at least one store');
      return;
    }
    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  const handleBulkConfirm = async () => {
    if (selectedStoreIds.length === 0) return;

    try {
      setBulkProcessing(true);
      const enabled = bulkAction === 'enable';
      const results = await bulkToggleStoreOnlineSelling(
        selectedStoreIds, 
        enabled, 
        bulkReason.trim() || undefined
      );

      if (results.success > 0) {
        toast.success(
          `Successfully ${enabled ? 'enabled' : 'disabled'} online selling for ${results.success} store${results.success > 1 ? 's' : ''}`
        );
      }

      if (results.failed > 0) {
        toast.error(
          `Failed to update ${results.failed} store${results.failed > 1 ? 's' : ''}. Check console for details.`
        );
        console.error('Bulk update errors:', results.errors);
      }

      // Reset state
      setSelectedStoreIds([]);
      setBulkDialogOpen(false);
      setBulkReason('');
      await loadData();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setBulkProcessing(false);
    }
  };

  const pendingApps = applications.filter(app => app.approval_status === 'pending');
  const approvedApps = applications.filter(app => app.approval_status === 'approved');
  const rejectedApps = applications.filter(app => app.approval_status === 'rejected');

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Elite Partner Management</h1>
              <p className="text-muted-foreground">Manage elite partner applications and plans</p>
            </div>
            <Button
              onClick={() => navigate('/admin/franchise/analytics')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingApps.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{approvedApps.length}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedApps.length}</p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Elite Partner Stores</p>
                  <p className="text-2xl font-bold">{franchiseStores.length}</p>
                </div>
                <StoreIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                  <p className="text-2xl font-bold">{plans.length}</p>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stores" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stores">
              Elite Partner Stores ({franchiseStores.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingApps.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApps.length})
            </TabsTrigger>
            <TabsTrigger value="plans">
              Plans ({plans.length})
            </TabsTrigger>
          </TabsList>

          {/* Franchise Stores Tab */}
          <TabsContent value="stores" className="space-y-4">
            {franchiseStores.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <StoreIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No elite partner stores found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Bulk Action Bar */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="select-all-stores"
                          checked={selectedStoreIds.length === franchiseStores.length && franchiseStores.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all-stores" className="cursor-pointer font-medium">
                          Select All ({selectedStoreIds.length} of {franchiseStores.length} selected)
                        </Label>
                      </div>
                      
                      {selectedStoreIds.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleBulkAction('enable')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Enable Selected
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBulkAction('disable')}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Disable Selected
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Store Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {franchiseStores.map((store) => (
                    <Card key={store.id} className={selectedStoreIds.includes(store.id) ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              id={`select-store-${store.id}`}
                              checked={selectedStoreIds.includes(store.id)}
                              onCheckedChange={(checked) => 
                                handleSelectStore(store.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-balance">{store.name}</CardTitle>
                              <CardDescription>
                                {store.location}
                              </CardDescription>
                            </div>
                          </div>
                          <FranchiseBadge variant="compact" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant={store.approval_status === 'approved' ? 'default' : 'secondary'}>
                                {store.approval_status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span className="font-semibold">
                                {new Date(store.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Online Selling Toggle */}
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor={`online-selling-store-${store.id}`} className="text-sm font-medium cursor-pointer">
                                  Online Selling
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {store.online_selling_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <Switch
                                  id={`online-selling-store-${store.id}`}
                                  checked={store.online_selling_enabled ?? true}
                                  onCheckedChange={() => 
                                    handleToggleOnlineSelling(
                                      store.id, 
                                      store.online_selling_enabled
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Control whether this elite partner can sell products online
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Pending Applications */}
          <TabsContent value="pending">
            {pendingApps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending applications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingApps.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{app.stores?.name}</CardTitle>
                          <CardDescription>
                            Applied on {new Date(app.applied_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Plan</Label>
                          <p className="font-semibold">{app.franchise_plans?.name}</p>
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <p className="font-semibold">₹{app.franchise_plans?.price}</p>
                        </div>
                        <div>
                          <Label>Payment Reference</Label>
                          <p className="text-sm text-muted-foreground">{app.payment_reference}</p>
                        </div>
                        <div>
                          <Label>Payment Status</Label>
                          <Badge variant="default">{app.payment_status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(app.id)}
                          disabled={processing}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectDialogOpen(true);
                          }}
                          disabled={processing}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Approved Applications */}
          <TabsContent value="approved" className="space-y-4">
            {approvedApps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Check className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No approved applications</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Bulk Action Bar */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="select-all"
                          checked={selectedStoreIds.length === approvedApps.length && approvedApps.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className="cursor-pointer font-medium">
                          Select All ({selectedStoreIds.length} of {approvedApps.length} selected)
                        </Label>
                      </div>
                      
                      {selectedStoreIds.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleBulkAction('enable')}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Enable Selected
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBulkAction('disable')}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Disable Selected
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Store Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {approvedApps.map((app) => (
                    <Card key={app.id} className={selectedStoreIds.includes(app.stores?.id || '') ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              id={`select-${app.id}`}
                              checked={selectedStoreIds.includes(app.stores?.id || '')}
                              onCheckedChange={(checked) => 
                                app.stores && handleSelectStore(app.stores.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-balance">{app.stores?.name}</CardTitle>
                              <CardDescription>
                                Approved on {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : 'N/A'}
                              </CardDescription>
                            </div>
                          </div>
                          <FranchiseBadge variant="compact" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Plan:</span>
                              <span className="font-semibold">{app.franchise_plans?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="font-semibold">₹{app.franchise_plans?.price}</span>
                            </div>
                          </div>
                          
                          {/* Online Selling Toggle */}
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor={`online-selling-${app.id}`} className="text-sm font-medium cursor-pointer">
                                  Online Selling
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {app.stores?.online_selling_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <Switch
                                  id={`online-selling-${app.id}`}
                                  checked={app.stores?.online_selling_enabled ?? true}
                                  onCheckedChange={() => 
                                    app.stores && handleToggleOnlineSelling(
                                      app.stores.id, 
                                      app.stores.online_selling_enabled
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Control whether this elite partner can sell products online
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Rejected Applications */}
          <TabsContent value="rejected">
            {rejectedApps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <X className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No rejected applications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {rejectedApps.map((app) => (
                  <Card key={app.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{app.stores?.name}</CardTitle>
                          <CardDescription>
                            Rejected on {app.rejected_at ? new Date(app.rejected_at).toLocaleDateString() : 'N/A'}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <Label>Reason</Label>
                          <p className="text-sm text-muted-foreground">{app.rejection_reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Plans */}
          <TabsContent value="plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">₹{plan.price}</div>
                    <CardDescription>{plan.duration_days} days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this elite partner application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'enable' ? 'Enable' : 'Disable'} Online Selling
            </DialogTitle>
            <DialogDescription>
              You are about to {bulkAction === 'enable' ? 'enable' : 'disable'} online selling for {selectedStoreIds.length} store{selectedStoreIds.length > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Affected Stores List */}
            <div>
              <Label className="text-sm font-medium">Affected Stores:</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                <ul className="space-y-1 text-sm">
                  {franchiseStores
                    .filter(store => selectedStoreIds.includes(store.id))
                    .map(store => (
                      <li key={store.id} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-pretty">{store.name}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Reason Field */}
            <div>
              <Label htmlFor="bulk-reason">Reason (Optional)</Label>
              <Textarea
                id="bulk-reason"
                placeholder={`Enter reason for ${bulkAction === 'enable' ? 'enabling' : 'disabling'} online selling...`}
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This reason will be logged for audit purposes
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBulkDialogOpen(false);
                setBulkReason('');
              }}
              disabled={bulkProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'enable' ? 'default' : 'destructive'}
              onClick={handleBulkConfirm}
              disabled={bulkProcessing}
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {bulkAction === 'enable' ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  {bulkAction === 'enable' ? 'Enable' : 'Disable'} Online Selling
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
