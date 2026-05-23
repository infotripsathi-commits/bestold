import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Package2, Store as StoreIcon, MessageSquare, Star, UserCheck, ShoppingBag, BarChart3, FlaskConical } from 'lucide-react';
import { getStoreByUserId, getProductsByStoreForSeller, getConversationsByUser, getFollowerCount, getOrdersBySeller } from '@/db/api';
import type { Store, Product, Conversation, Order } from '@/types';
import ShareStoreButton from '@/components/ShareStoreButton';
import StoreQRCodeCard from '@/components/StoreQRCodeCard';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const storeData = await getStoreByUserId(user.id);
      setStore(storeData);

      if (storeData) {
        const [productsData, conversationsData, followerCountData] = await Promise.all([
          getProductsByStoreForSeller(storeData.id),
          getConversationsByUser(user.id),
          getFollowerCount(user.id),
        ]);

        setProducts(productsData);
        setConversations(conversationsData.filter(c => c.seller_id === user.id));
        setFollowerCount(followerCountData);

        // Load orders separately with error handling
        try {
          const ordersData = await getOrdersBySeller();
          console.log('Dashboard orders loaded:', ordersData.length);
          setOrders(ordersData);
        } catch (ordersError) {
          console.error('Failed to load orders in dashboard:', ordersError);
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <StoreIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Create Your Store</h2>
            <p className="text-muted-foreground mb-6">
              You need to create a store before you can start selling
            </p>
            <Button asChild size="lg">
              <Link to="/seller/store">Create Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.status === 'active');
  const soldProducts = products.filter(p => p.status === 'sold');
  const pendingOrders = orders.filter(o => o.order_status === 'pending');
  const totalOrders = orders.length;

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <Button asChild className={store.approval_status === 'approved' ? '' : 'invisible pointer-events-none'}>
            <Link to="/seller/products/new">Add Product</Link>
          </Button>
        </div>

        {/* Store Approval Status Banner */}
        {store.approval_status === 'pending' && (
          <Card className="mb-6 border-yellow-500 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">Store Pending Approval</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                    Your store is currently under review by our admin team. You'll be able to add products once it's approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {store.approval_status === 'rejected' && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-destructive p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Store Application Rejected</h3>
                  <p className="text-sm text-destructive/80 mt-1">
                    {store.rejection_reason || 'Your store application was rejected.'}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/seller/store">Update Store Information</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {store.approval_status === 'approved' && (
          <Card className="mb-6 border-green-500 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-700 dark:text-green-400">Store Approved & Live</h3>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Your store is approved and visible to customers!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                {soldProducts.length} sold
              </p>
            </CardContent>
          </Card>

          {store.is_franchise && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/seller/online-orders'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingOrders.length} pending approval
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Active conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Store Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.average_rating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                {store.total_reviews} {store.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followerCount}</div>
              <p className="text-xs text-muted-foreground">
                {followerCount === 1 ? 'follower' : 'followers'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/seller/store">
                  <StoreIcon className="mr-2 h-4 w-4" />
                  Manage Store
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/seller/products">
                  <Package2 className="mr-2 h-4 w-4" />
                  Manage Products
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Messages
                </Link>
              </Button>
              {store?.is_franchise && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/seller/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/seller/insights">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Product Insights
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/seller/ab-tests">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  A/B Testing
                </Link>
              </Button>
              {store && (
                <ShareStoreButton 
                  store={store} 
                  variant="outline" 
                  size="default"
                  className="w-full justify-start"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Store Name</p>
                  <p className="text-sm text-muted-foreground">{store.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{store.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Products</p>
                  <p className="text-sm text-muted-foreground">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store QR Code */}
          {store && <StoreQRCodeCard store={store} />}
        </div>
      </div>
    </div>
  );
}
