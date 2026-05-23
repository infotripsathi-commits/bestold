import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Wallet, TrendingUp, Store as StoreIcon, Clock, CheckCircle, Users, DollarSign } from 'lucide-react';
import { getAllStores, getFranchiseApplications, getPayouts } from '@/db/api';
import { toast } from 'sonner';
import type { Store, FranchiseApplication, FranchisePayout } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';

export default function AdminFranchiseAnalyticsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [payouts, setPayouts] = useState<FranchisePayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [storesData, applicationsData, payoutsData] = await Promise.all([
        getAllStores(1000),
        getFranchiseApplications(),
        getPayouts()
      ]);

      setStores(storesData);
      setApplications(applicationsData);
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const franchiseStores = stores.filter(s => s.is_franchise);
  const totalFranchiseCount = franchiseStores.length;
  const totalStoresCount = stores.length;
  const franchisePercentage = totalStoresCount > 0 ? (totalFranchiseCount / totalStoresCount * 100).toFixed(1) : '0';

  const pendingApplications = applications.filter(a => a.approval_status === 'pending');
  const approvedApplications = applications.filter(a => a.approval_status === 'approved');
  const rejectedApplications = applications.filter(a => a.approval_status === 'rejected');
  const conversionRate = applications.length > 0 ? (approvedApplications.length / applications.length * 100).toFixed(1) : '0';

  const releasedPayouts = payouts.filter(p => p.status === 'released');
  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const totalPayoutsReleased = releasedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPayoutsPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  // Top performing franchise stores (by total payouts)
  const storePayouts = new Map<string, number>();
  releasedPayouts.forEach(payout => {
    const current = storePayouts.get(payout.store_id) || 0;
    storePayouts.set(payout.store_id, current + payout.amount);
  });

  const topStores = franchiseStores
    .map(store => ({
      store,
      totalEarnings: storePayouts.get(store.id) || 0
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 10);

  // Monthly revenue trends (last 6 months)
  const monthlyRevenue = new Map<string, number>();
  releasedPayouts.forEach(payout => {
    if (payout.released_at) {
      const date = new Date(payout.released_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyRevenue.get(monthKey) || 0;
      monthlyRevenue.set(monthKey, current + payout.amount);
    }
  });

  const sortedMonths = Array.from(monthlyRevenue.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Franchise Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into franchise performance and revenue</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Franchise Stores</CardTitle>
                <StoreIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFranchiseCount}</div>
                <p className="text-xs text-muted-foreground">
                  {franchisePercentage}% of all stores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payouts Released</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalPayoutsReleased.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {releasedPayouts.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">₹{totalPayoutsPending.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingPayouts.length} awaiting release
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {approvedApplications.length} of {applications.length} applications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
              <TabsTrigger value="top-stores">Top Performers</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Status</CardTitle>
                    <CardDescription>Breakdown of franchise applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Approved</span>
                        </div>
                        <Badge variant="default">{approvedApplications.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium">Pending</span>
                        </div>
                        <Badge variant="secondary">{pendingApplications.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-red-600" />
                          <span className="font-medium">Rejected</span>
                        </div>
                        <Badge variant="outline">{rejectedApplications.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Summary</CardTitle>
                    <CardDescription>Financial overview of franchise payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Released</p>
                          <p className="text-2xl font-bold">₹{totalPayoutsReleased.toFixed(2)}</p>
                        </div>
                        <Wallet className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Release</p>
                          <p className="text-2xl font-bold text-yellow-600">₹{totalPayoutsPending.toFixed(2)}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Average Payout</p>
                          <p className="text-2xl font-bold">
                            ₹{releasedPayouts.length > 0 ? (totalPayoutsReleased / releasedPayouts.length).toFixed(2) : '0.00'}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Revenue Trends Tab */}
            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Trends</CardTitle>
                  <CardDescription>Franchise payout trends over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedMonths.length > 0 ? (
                    <div className="space-y-4">
                      {sortedMonths.map(([month, amount]) => {
                        const maxAmount = Math.max(...sortedMonths.map(m => m[1]));
                        const percentage = (amount / maxAmount) * 100;
                        const date = new Date(month + '-01');
                        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                        return (
                          <div key={month} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{monthName}</span>
                              <span className="font-bold">₹{amount.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total (6 months)</span>
                          <span className="text-lg font-bold">
                            ₹{sortedMonths.reduce((sum, [, amount]) => sum + amount, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No revenue data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Performers Tab */}
            <TabsContent value="top-stores">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Franchise Stores</CardTitle>
                  <CardDescription>Ranked by total payouts released</CardDescription>
                </CardHeader>
                <CardContent>
                  {topStores.length > 0 ? (
                    <div className="space-y-4">
                      {topStores.map((item, index) => (
                        <div key={item.store.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                            <span className="font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{item.store.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{item.store.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{item.totalEarnings.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Total Earnings</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No franchise stores with payouts yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Latest franchise applications and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length > 0 ? (
                    <div className="space-y-3">
                      {applications.slice(0, 10).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold">{app.stores?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {app.franchise_plans?.name} - ₹{app.franchise_plans?.price}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied: {new Date(app.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              app.approval_status === 'approved' ? 'default' :
                              app.approval_status === 'pending' ? 'secondary' :
                              'outline'
                            }
                          >
                            {app.approval_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No applications yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
