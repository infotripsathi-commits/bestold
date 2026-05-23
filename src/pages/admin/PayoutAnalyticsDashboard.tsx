import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download,
  BarChart3,
  Bell,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  getPayoutAnalyticsSummary,
  getMonthlyPayoutTrends,
  getTopSellersByPayouts,
  getPaymentMethodDistribution,
  getPendingPayoutAging,
  getPayoutConversionMetrics,
  getAllPayoutSellers,
  type PayoutAnalyticsSummary,
  type MonthlyPayoutTrend,
  type TopSellerPayout,
  type PaymentMethodDistribution,
  type PendingPayoutAging,
  type PayoutConversionMetrics,
} from '@/db/payouts';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { playEventSound, setSoundPreferences, type EventSoundType } from '@/utils/soundNotifications';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface RealtimeFilters {
  eventTypes: {
    new_request: boolean;
    approved: boolean;
    completed: boolean;
    rejected: boolean;
  };
  minAmount: number;
  selectedSellers: string[];
  soundEnabled: boolean;
  soundVolume: number;
}

const DEFAULT_FILTERS: RealtimeFilters = {
  eventTypes: {
    new_request: true,
    approved: true,
    completed: true,
    rejected: true,
  },
  minAmount: 0,
  selectedSellers: [],
  soundEnabled: true,
  soundVolume: 50,
};

export default function PayoutAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PayoutAnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyPayoutTrend[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellerPayout[]>([]);
  const [methodDistribution, setMethodDistribution] = useState<PaymentMethodDistribution[]>([]);
  const [agingReport, setAgingReport] = useState<PendingPayoutAging[]>([]);
  const [conversionMetrics, setConversionMetrics] = useState<PayoutConversionMetrics | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(() => {
    const saved = localStorage.getItem('payout-analytics-realtime');
    return saved ? JSON.parse(saved) : true;
  });
  const [filters, setFilters] = useState<RealtimeFilters>(() => {
    const saved = localStorage.getItem('payout-analytics-filters');
    return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
  });
  const [allSellers, setAllSellers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [newPendingCount, setNewPendingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    loadAnalytics();
    loadSellers();
  }, []);

  useEffect(() => {
    // Save realtime preference
    localStorage.setItem('payout-analytics-realtime', JSON.stringify(realtimeEnabled));

    if (realtimeEnabled) {
      setupRealtimeSubscription();
    } else {
      cleanupRealtimeSubscription();
    }

    return () => {
      cleanupRealtimeSubscription();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [realtimeEnabled]);

  useEffect(() => {
    // Save filters and update sound preferences
    localStorage.setItem('payout-analytics-filters', JSON.stringify(filters));
    setSoundPreferences(filters.soundEnabled, filters.soundVolume / 100);
  }, [filters]);

  const loadSellers = async () => {
    const sellers = await getAllPayoutSellers();
    setAllSellers(sellers);
  };

  const setupRealtimeSubscription = () => {
    // Clean up existing subscription
    cleanupRealtimeSubscription();

    // Create new channel
    const channel = supabase
      .channel('payout-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payout_requests',
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const cleanupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    console.log('Realtime update:', payload);

    // Apply filters
    if (!shouldProcessEvent(payload)) {
      return;
    }

    // Determine event type and sound
    let eventType: EventSoundType | null = null;
    let message = '';

    if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
      eventType = 'new_request';
      message = 'New payout request received';
      setNewPendingCount(prev => prev + 1);
    } else if (payload.eventType === 'UPDATE') {
      const oldStatus = payload.old?.status;
      const newStatus = payload.new?.status;

      if (oldStatus === 'pending' && newStatus === 'approved') {
        eventType = 'approved';
        message = 'Payout request approved';
      } else if (newStatus === 'completed') {
        eventType = 'completed';
        message = 'Payout completed';
      } else if (newStatus === 'rejected') {
        eventType = 'rejected';
        message = 'Payout request rejected';
      }
    }

    // Show notification and play sound
    if (eventType && message) {
      toast.info(message, {
        description: `Amount: ₹${payload.new?.amount?.toLocaleString('en-IN')}`,
      });

      if (filters.soundEnabled) {
        playEventSound(eventType, filters.soundVolume / 100);
      }
    }

    // Debounced refresh to avoid excessive updates
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    setIsRefreshing(true);
    refreshTimeoutRef.current = setTimeout(() => {
      loadAnalytics(true);
      setIsRefreshing(false);
    }, 2000); // Wait 2 seconds before refreshing
  };

  const shouldProcessEvent = (payload: any): boolean => {
    const eventData = payload.new || payload.old;
    if (!eventData) return false;

    // Check amount threshold
    if (eventData.amount < filters.minAmount) {
      return false;
    }

    // Check seller filter
    if (filters.selectedSellers.length > 0 && !filters.selectedSellers.includes(eventData.seller_id)) {
      return false;
    }

    // Check event type filter
    if (payload.eventType === 'INSERT' && eventData.status === 'pending') {
      return filters.eventTypes.new_request;
    } else if (payload.eventType === 'UPDATE') {
      const oldStatus = payload.old?.status;
      const newStatus = payload.new?.status;

      if (oldStatus === 'pending' && newStatus === 'approved') {
        return filters.eventTypes.approved;
      } else if (newStatus === 'completed') {
        return filters.eventTypes.completed;
      } else if (newStatus === 'rejected') {
        return filters.eventTypes.rejected;
      }
    }

    return true;
  };

  const loadAnalytics = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const [
        summaryData,
        trendsData,
        topSellersData,
        methodData,
        agingData,
        conversionData,
      ] = await Promise.all([
        getPayoutAnalyticsSummary(),
        getMonthlyPayoutTrends(12),
        getTopSellersByPayouts(10),
        getPaymentMethodDistribution(),
        getPendingPayoutAging(),
        getPayoutConversionMetrics(),
      ]);

      setSummary(summaryData);
      setTrends(trendsData.reverse()); // Reverse to show oldest first
      setTopSellers(topSellersData);
      setMethodDistribution(methodData);
      setAgingReport(agingData);
      setConversionMetrics(conversionData);

      // Reset new pending count after refresh
      if (silent) {
        setNewPendingCount(0);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      if (!silent) {
        toast.error('Failed to load payout analytics');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleToggleRealtime = (enabled: boolean) => {
    setRealtimeEnabled(enabled);
    if (enabled) {
      toast.success('Real-time updates enabled');
    } else {
      toast.info('Real-time updates disabled');
      setNewPendingCount(0);
    }
  };

  const handleManualRefresh = () => {
    setNewPendingCount(0);
    loadAnalytics();
  };

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon');
    // TODO: Implement PDF export with jsPDF
  };

  const updateFilter = <K extends keyof RealtimeFilters>(key: K, value: RealtimeFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleEventType = (eventType: keyof RealtimeFilters['eventTypes']) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: {
        ...prev.eventTypes,
        [eventType]: !prev.eventTypes[eventType],
      },
    }));
  };

  const toggleSeller = (sellerId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSellers: prev.selectedSellers.includes(sellerId)
        ? prev.selectedSellers.filter(id => id !== sellerId)
        : [...prev.selectedSellers, sellerId],
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    toast.success('Filters reset to defaults');
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    const eventTypesEnabled = Object.values(filters.eventTypes).filter(Boolean).length;
    if (eventTypesEnabled < 4) count++;
    if (filters.minAmount > 0) count++;
    if (filters.selectedSellers.length > 0) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Payout Analytics</h1>
            {isRefreshing && (
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            )}
            {newPendingCount > 0 && (
              <Badge variant="destructive" className="relative">
                <Bell className="mr-1 h-3 w-3" />
                {newPendingCount} new
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into payout operations and trends
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="realtime-mode"
              checked={realtimeEnabled}
              onCheckedChange={handleToggleRealtime}
            />
            <Label htmlFor="realtime-mode" className="cursor-pointer">
              Real-time updates
            </Label>
          </div>
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Realtime Notification Filters</DialogTitle>
                <DialogDescription>
                  Configure which payout events trigger notifications and sounds
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Event Types */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Event Types</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="event-new"
                        checked={filters.eventTypes.new_request}
                        onCheckedChange={() => toggleEventType('new_request')}
                      />
                      <Label htmlFor="event-new" className="cursor-pointer">
                        New Requests
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="event-approved"
                        checked={filters.eventTypes.approved}
                        onCheckedChange={() => toggleEventType('approved')}
                      />
                      <Label htmlFor="event-approved" className="cursor-pointer">
                        Approvals
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="event-completed"
                        checked={filters.eventTypes.completed}
                        onCheckedChange={() => toggleEventType('completed')}
                      />
                      <Label htmlFor="event-completed" className="cursor-pointer">
                        Completions
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="event-rejected"
                        checked={filters.eventTypes.rejected}
                        onCheckedChange={() => toggleEventType('rejected')}
                      />
                      <Label htmlFor="event-rejected" className="cursor-pointer">
                        Rejections
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Amount Threshold */}
                <div className="space-y-3">
                  <Label htmlFor="min-amount" className="text-base font-semibold">
                    Minimum Amount (₹)
                  </Label>
                  <Input
                    id="min-amount"
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => updateFilter('minAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    Only notify for payouts above this amount
                  </p>
                </div>

                {/* Seller Filter */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Monitor Specific Sellers ({filters.selectedSellers.length} selected)
                  </Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                    {allSellers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Loading sellers...</p>
                    ) : (
                      allSellers.map((seller) => (
                        <div key={seller.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`seller-${seller.id}`}
                            checked={filters.selectedSellers.includes(seller.id)}
                            onCheckedChange={() => toggleSeller(seller.id)}
                          />
                          <Label htmlFor={`seller-${seller.id}`} className="cursor-pointer flex-1">
                            <div className="font-medium">{seller.full_name}</div>
                            <div className="text-sm text-muted-foreground">{seller.email}</div>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Leave empty to monitor all sellers
                  </p>
                </div>

                {/* Sound Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled" className="text-base font-semibold">
                      Sound Notifications
                    </Label>
                    <Switch
                      id="sound-enabled"
                      checked={filters.soundEnabled}
                      onCheckedChange={(checked) => updateFilter('soundEnabled', checked)}
                    />
                  </div>
                  {filters.soundEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {filters.soundVolume === 0 ? (
                          <VolumeX className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Slider
                          value={[filters.soundVolume]}
                          onValueChange={([value]) => updateFilter('soundVolume', value)}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12 text-right">
                          {filters.soundVolume}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Different tones for each event type
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetFilters}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => setFilterDialogOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(summary?.total_completed_amount || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.total_completed_count || 0} completed payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Payout Amount</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Math.round(summary?.avg_payout_amount || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(summary?.avg_processing_time_days || 0)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Request to payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionMetrics?.completion_rate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of all requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payout Pipeline</CardTitle>
          <CardDescription>Request status distribution and conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{conversionMetrics?.total_requests || 0}</div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{conversionMetrics?.pending_count || 0}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{conversionMetrics?.approved_count || 0}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{conversionMetrics?.rejected_count || 0}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{conversionMetrics?.completed_count || 0}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-8">
            <div className="text-center">
              <div className="text-xl font-semibold">{conversionMetrics?.approval_rate || 0}%</div>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">{Math.round(conversionMetrics?.avg_processing_days || 0)} days</div>
              <p className="text-sm text-muted-foreground">Avg Processing Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Monthly Payout Trends</CardTitle>
          <CardDescription>Total payouts processed per month (last 12 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_amount" 
                stroke="#8884d8" 
                name="Total Amount"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Sellers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sellers by Payout Volume</CardTitle>
            <CardDescription>Top 10 sellers by total payouts received</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSellers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="seller_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Bar dataKey="total_payouts" fill="#82ca9d" name="Total Payouts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <CardDescription>Breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.payment_method}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {methodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payout Aging Report */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payout Aging Report</CardTitle>
          <CardDescription>
            Requests waiting for approval or payment ({agingReport.length} pending)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agingReport.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending payouts
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Seller</TableHead>
                    <TableHead className="whitespace-nowrap">Store</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Days Pending</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingReport.map((item) => (
                    <TableRow key={item.request_id}>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{item.seller_name}</div>
                          <div className="text-sm text-muted-foreground">{item.seller_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.store_name}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap capitalize">
                        {item.status}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.days_pending > 7 && (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                          <span className={item.days_pending > 7 ? 'text-amber-600 font-semibold' : ''}>
                            {item.days_pending} days
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
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
