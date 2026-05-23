import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Store, Package, Star, Clock, CheckCircle, XCircle, TrendingUp, ShoppingCart, Sliders, PackageCheck } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { getDeliveryCharge, getPendingProductsCount } from '@/db/api';
import { toast } from 'sonner';
import AdminNav from '@/components/layouts/AdminNav';

interface DashboardStats {
  totalUsers: number;
  totalStores: number;
  pendingStores: number;
  approvedStores: number;
  rejectedStores: number;
  totalProducts: number;
  activeProducts: number;
  pendingProducts?: number;
  totalReviews: number;
  totalOnlineOrders: number;
  deliveryCharge?: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStores: 0,
    pendingStores: 0,
    approvedStores: 0,
    rejectedStores: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalReviews: 0,
    totalOnlineOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get store counts
      const { count: storeCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      const { count: approvedCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved');

      const { count: rejectedCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'rejected');

      // Get product counts
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: activeProductCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get review count
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Get online orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get delivery charge
      const deliveryCharge = await getDeliveryCharge();

      // Get pending products count
      const pendingProductsCount = await getPendingProductsCount();

      setStats({
        totalUsers: userCount || 0,
        totalStores: storeCount || 0,
        pendingStores: pendingCount || 0,
        approvedStores: approvedCount || 0,
        rejectedStores: rejectedCount || 0,
        totalProducts: productCount || 0,
        activeProducts: activeProductCount || 0,
        pendingProducts: pendingProductsCount || 0,
        totalReviews: reviewCount || 0,
        totalOnlineOrders: ordersCount || 0,
        deliveryCharge: deliveryCharge || 50,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of platform statistics and pending actions
            </p>
          </div>

          {/* Pending Approvals Alert */}
          {stats.pendingStores > 0 && (
            <Card className="mb-6 border-yellow-500 bg-yellow-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-yellow-500 p-2">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
                        {stats.pendingStores} Store{stats.pendingStores !== 1 ? 's' : ''} Awaiting Approval
                      </h3>
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        Review and approve new seller applications
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="default">
                    <Link to="/admin/approvals">Review Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Products Alert */}
          {(stats.pendingProducts ?? 0) > 0 && (
            <Card className="mb-6 border-orange-500 bg-orange-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-500 p-2">
                      <PackageCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                        {stats.pendingProducts} Product{stats.pendingProducts !== 1 ? 's' : ''} Awaiting Approval
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-500">
                        Review product photos and details before approval
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="default">
                    <Link to="/admin/product-approvals">Review Products</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Charge Settings Card */}
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary p-2">
                    <Sliders className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Current Delivery Charge: ₹{stats.deliveryCharge || 50}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure delivery charges and other platform settings
                    </p>
                  </div>
                </div>
                <Button asChild variant="default">
                  <Link to="/admin/platform-settings">Manage Settings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered accounts
                </p>
              </CardContent>
            </Card>

            {/* Stores */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStores}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.approvedStores} approved, {stats.pendingStores} pending
                </p>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeProducts} active listings
                </p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer feedback
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Orders Stats */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOnlineOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total orders placed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Store Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Stores</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingStores}</div>
                <Button asChild variant="link" className="px-0 mt-2">
                  <Link to="/admin/approvals">Review Pending →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Stores</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedStores}</div>
                <Button asChild variant="link" className="px-0 mt-2">
                  <Link to="/admin/stores">View All →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected Stores</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejectedStores}</div>
                <Button asChild variant="link" className="px-0 mt-2">
                  <Link to="/admin/approvals">View Rejected →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link to="/admin/approvals">
                    <Clock className="h-6 w-6" />
                    <span>Review Approvals</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link to="/admin/users">
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link to="/admin/products">
                    <Package className="h-6 w-6" />
                    <span>Manage Products</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link to="/admin/platform-settings">
                    <Sliders className="h-6 w-6" />
                    <span>Platform Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
