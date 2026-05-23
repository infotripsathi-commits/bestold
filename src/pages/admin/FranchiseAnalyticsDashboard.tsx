import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Star,
  Package,
  ArrowLeft,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { getFranchiseStoreAnalytics, getFranchisePerformanceTrends, getAllFranchiseStoresForAdmin } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FranchiseStoreAnalytics, FranchisePerformanceTrend } from '@/types';

export default function FranchiseAnalyticsDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<FranchiseStoreAnalytics[]>([]);
  const [trends, setTrends] = useState<FranchisePerformanceTrend[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if user is admin
    if (profile && profile.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }

    loadData();
  }, [profile, navigate]);

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [selectedStore, selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, trendsData, storesData] = await Promise.all([
        getFranchiseStoreAnalytics(
          selectedStore === 'all' ? undefined : selectedStore
        ),
        getFranchisePerformanceTrends(
          selectedStore === 'all' ? undefined : selectedStore,
          parseInt(selectedPeriod)
        ),
        getAllFranchiseStoresForAdmin()
      ]);
      
      setAnalytics(analyticsData);
      setTrends(trendsData);
      setStores(storesData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate metrics
  const aggregateMetrics = analytics.reduce(
    (acc, store) => ({
      totalRevenue: acc.totalRevenue + Number(store.revenue_generated),
      totalSales: acc.totalSales + Number(store.total_sales),
      totalProducts: acc.totalProducts + Number(store.total_products),
      totalActiveOrders: acc.totalActiveOrders + Number(store.active_orders),
      avgRating: acc.avgRating + Number(store.average_rating),
      storeCount: acc.storeCount + 1,
    }),
    { totalRevenue: 0, totalSales: 0, totalProducts: 0, totalActiveOrders: 0, avgRating: 0, storeCount: 0 }
  );

  const overallAvgRating = aggregateMetrics.storeCount > 0 
    ? (aggregateMetrics.avgRating / aggregateMetrics.storeCount).toFixed(1)
    : '0.0';

  const overallAvgOrderValue = aggregateMetrics.totalSales > 0
    ? (aggregateMetrics.totalRevenue / aggregateMetrics.totalSales).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 mb-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/franchise')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Franchise Management
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Franchise Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor performance and identify opportunities</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Store</label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Time Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">₹{aggregateMetrics.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: ₹{overallAvgOrderValue}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{aggregateMetrics.totalSales}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed orders
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{aggregateMetrics.totalActiveOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    In progress
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{overallAvgRating}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer satisfaction
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Revenue and orders over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    name="Revenue (₹)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_orders"
                    stroke="#3b82f6"
                    name="Orders"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Store Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Store Performance Comparison</CardTitle>
            <CardDescription>Detailed metrics for each franchise store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Store Name</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Products</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Sales</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Avg Order</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Rating</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Active Orders</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.map((store) => {
                      const performanceScore = Number(store.revenue_generated) + Number(store.total_sales) * 100;
                      const isTopPerformer = performanceScore > 1000;
                      const needsSupport = Number(store.total_sales) < 5 && Number(store.average_rating) < 3;

                      return (
                        <TableRow key={store.store_id}>
                          <TableCell className="whitespace-nowrap font-medium">{store.store_name}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">{store.total_products}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">{store.total_sales}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">₹{Number(store.revenue_generated).toLocaleString()}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            ₹{Number(store.average_order_value).toFixed(2)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              {Number(store.average_rating).toFixed(1)}
                              <span className="text-xs text-muted-foreground">
                                ({store.total_reviews})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">{store.active_orders}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {isTopPerformer && (
                              <Badge variant="default" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Top Performer
                              </Badge>
                            )}
                            {needsSupport && (
                              <Badge variant="destructive" className="gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Needs Support
                              </Badge>
                            )}
                            {!isTopPerformer && !needsSupport && (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
