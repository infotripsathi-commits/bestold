import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingDown, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Clock,
  Star,
  Package
} from 'lucide-react';
import {
  generateAdjustmentSuggestions,
  getAdjustmentSuggestions,
  approveAdjustmentSuggestion,
  rejectAdjustmentSuggestion,
  bulkApproveAdjustments,
  bulkRejectAdjustments,
  type ReturnPeriodAdjustmentSuggestion,
} from '@/db/returnPolicy';
import { toast } from 'sonner';

export default function ReturnPeriodAdjustmentsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<ReturnPeriodAdjustmentSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    loadSuggestions();
  }, [filterStatus]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await getAdjustmentSuggestions(status);
      setSuggestions(data);
      setSelectedIds([]);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast.error('Failed to load adjustment suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const count = await generateAdjustmentSuggestions();
      toast.success(`Generated ${count} new adjustment suggestions`);
      loadSuggestions();
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      const success = await approveAdjustmentSuggestion(id);
      if (success) {
        toast.success('Adjustment approved and applied');
        loadSuggestions();
      } else {
        toast.error('Failed to approve adjustment');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(true);
    try {
      const success = await rejectAdjustmentSuggestion(id);
      if (success) {
        toast.success('Adjustment rejected');
        loadSuggestions();
      } else {
        toast.error('Failed to reject adjustment');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('No suggestions selected');
      return;
    }

    setProcessing(true);
    try {
      const count = await bulkApproveAdjustments(selectedIds);
      toast.success(`Approved ${count} adjustments`);
      loadSuggestions();
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      toast.error('No suggestions selected');
      return;
    }

    setProcessing(true);
    try {
      const count = await bulkRejectAdjustments(selectedIds);
      toast.success(`Rejected ${count} adjustments`);
      loadSuggestions();
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingSuggestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingSuggestions.map(s => s.id));
    }
  };

  const getAdjustmentBadge = (type: string) => {
    const variants = {
      reduce: { variant: 'default' as const, icon: TrendingDown, color: 'text-green-600' },
      increase: { variant: 'destructive' as const, icon: TrendingUp, color: 'text-red-600' },
      maintain: { variant: 'outline' as const, icon: Clock, color: 'text-gray-600' },
    };
    const { variant, icon: Icon, color } = variants[type as keyof typeof variants] || variants.maintain;
    return (
      <Badge variant={variant} className="capitalize">
        <Icon className={`mr-1 h-3 w-3 ${color}`} />
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock },
      approved: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: XCircle },
    };
    const { variant, icon: Icon } = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge variant={variant} className="capitalize">
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
    reduce: suggestions.filter(s => s.adjustment_type === 'reduce').length,
    increase: suggestions.filter(s => s.adjustment_type === 'increase').length,
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
          <h1 className="text-3xl font-bold mb-2">Return Period Adjustments</h1>
          <p className="text-muted-foreground">
            Review and approve intelligent return period adjustments based on seller performance
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          Generate Suggestions
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                How Dynamic Adjustments Work
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The system analyzes seller performance metrics (return rate, product ratings, account age, transaction volume) 
                to suggest return period adjustments. High-performing sellers get reduced periods as rewards, 
                while sellers with concerns get increased periods for customer protection. Review and approve suggestions below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.reduce}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Increases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.increase}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {filterStatus === 'pending' && pendingSuggestions.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.length === pendingSuggestions.length && pendingSuggestions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedIds.length} of {pendingSuggestions.length} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={selectedIds.length === 0 || processing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={selectedIds.length === 0 || processing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={filterStatus === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('approved')}
        >
          Approved ({stats.approved})
        </Button>
        <Button
          variant={filterStatus === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('rejected')}
        >
          Rejected ({stats.rejected})
        </Button>
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All ({stats.total})
        </Button>
      </div>

      {/* Suggestions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment Suggestions</CardTitle>
          <CardDescription>
            Review seller performance and approve or reject suggested return period changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suggestions found. Click "Generate Suggestions" to analyze seller performance.
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    {filterStatus === 'pending' && <TableHead className="whitespace-nowrap w-12"></TableHead>}
                    <TableHead className="whitespace-nowrap">Seller</TableHead>
                    <TableHead className="whitespace-nowrap">Current Period</TableHead>
                    <TableHead className="whitespace-nowrap">Suggested Period</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Performance</TableHead>
                    <TableHead className="whitespace-nowrap">Reasoning</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    {filterStatus === 'pending' && <TableHead className="whitespace-nowrap">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      {filterStatus === 'pending' && (
                        <TableCell className="whitespace-nowrap">
                          <Checkbox
                            checked={selectedIds.includes(suggestion.id)}
                            onCheckedChange={() => toggleSelection(suggestion.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{suggestion.seller?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{suggestion.seller?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">{suggestion.current_return_period} days</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="default">{suggestion.suggested_return_period} days</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getAdjustmentBadge(suggestion.adjustment_type)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <BarChart3 className="h-3 w-3" />
                            Score: {suggestion.performance_metrics.performance_score.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3" />
                            Rating: {suggestion.performance_metrics.avg_rating.toFixed(1)}/5
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Package className="h-3 w-3" />
                            Orders: {suggestion.performance_metrics.total_orders}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{suggestion.reasoning}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(suggestion.status)}
                      </TableCell>
                      {filterStatus === 'pending' && (
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(suggestion.id)}
                              disabled={processing}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(suggestion.id)}
                              disabled={processing}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
