import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Package, Store, Tag, Calendar, IndianRupee, Image as ImageIcon, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { getPendingProducts, approveProduct, rejectProduct, getProductApprovalStats, getSellerPerformanceStats, type ProductApprovalStats, type SellerPerformanceStats } from '@/db/api';
import StatCard from '@/components/StatCard';
import SellerPerformanceTable from '@/components/SellerPerformanceTable';
import VehicleSpecsBadges from '@/components/VehicleSpecsBadges';
import type { CarDetails, BikeDetails, PhoneDetails } from '@/types';

interface ProductWithDetails {
  id: string;
  title: string;
  description?: string;
  price: number;
  condition: string;
  images?: string[];
  created_at: string;
  car_details?: CarDetails | null;
  bike_details?: BikeDetails | null;
  phone_details?: PhoneDetails | null;
  store?: {
    id: string;
    name: string;
    seller_id: string;
    is_franchise: boolean;
  };
  category?: {
    id: string;
    name: string;
  };
}

export default function AdminProductApprovalsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<ProductApprovalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sellerPerformance, setSellerPerformance] = useState<SellerPerformanceStats[]>([]);
  const [sellerPerfLoading, setSellerPerfLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadStats();
    loadSellerPerformance();
  }, []);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getProductApprovalStats();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSellerPerformance = async () => {
    try {
      setSellerPerfLoading(true);
      const data = await getSellerPerformanceStats();
      setSellerPerformance(data);
    } catch (error: any) {
      console.error('Failed to load seller performance:', error);
    } finally {
      setSellerPerfLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getPendingProducts();
      setProducts(data as ProductWithDetails[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: string) => {
    try {
      setProcessing(true);
      await approveProduct(productId);
      toast.success('Product approved successfully');
      loadProducts();
      loadStats(); // Reload statistics
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve product');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProduct) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await rejectProduct(selectedProduct.id, rejectionReason);
      toast.success('Product rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedProduct(null);
      loadProducts();
      loadStats(); // Reload statistics
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject product');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setShowRejectDialog(true);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2 bg-muted" />
          <Skeleton className="h-4 w-96 bg-muted" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve products submitted by sellers
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Pending Products"
          value={stats?.pending_count ?? 0}
          icon={Package}
          description="Awaiting review"
          loading={statsLoading}
          iconClassName="text-orange-600"
        />
        <StatCard
          title="Avg. Approval Time"
          value={stats?.avg_approval_hours ? `${stats.avg_approval_hours}h` : '0h'}
          icon={Clock}
          description="Average processing time"
          loading={statsLoading}
          iconClassName="text-blue-600"
        />
        <StatCard
          title="Approved Today"
          value={stats?.approved_today_count ?? 0}
          icon={TrendingUp}
          description="Products approved today"
          loading={statsLoading}
          iconClassName="text-green-600"
        />
        <StatCard
          title="Rejected This Week"
          value={stats?.rejected_week_count ?? 0}
          icon={TrendingDown}
          description="Last 7 days"
          loading={statsLoading}
          iconClassName="text-red-600"
        />
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Products</h3>
              <p className="text-muted-foreground">
                All products have been reviewed. New submissions will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>

          <div className="grid gap-6">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-[300px_1fr] gap-6">
                    {/* Product Images */}
                    <div className="space-y-3">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {product.images.slice(1, 5).map((img, idx) => (
                                <div key={idx} className="aspect-square rounded overflow-hidden bg-muted">
                                  <img
                                    src={img}
                                    alt={`${product.title} ${idx + 2}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ImageIcon className="h-3 w-3" />
                            <span>{product.images.length} image{product.images.length !== 1 ? 's' : ''}</span>
                          </div>
                        </>
                      ) : (
                        <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-xl font-bold">{product.title}</h3>
                          <Badge variant="outline" className="shrink-0">
                            {product.condition}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-3">
                          <IndianRupee className="h-5 w-5" />
                          {product.price.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {product.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {product.description}
                          </p>
                        </div>
                      )}

                      {/* Vehicle specs */}
                      <VehicleSpecsBadges product={product as any} />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{product.store?.name || 'Unknown Store'}</p>
                            {product.store?.is_franchise && (
                              <Badge variant="secondary" className="text-xs mt-1">ELITE</Badge>
                            )}
                          </div>
                        </div>

                        {product.category && (
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>{product.category.name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Submitted {new Date(product.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleApprove(product.id)}
                          disabled={processing}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openRejectDialog(product)}
                          disabled={processing}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Seller Performance Section */}
      <div className="mt-8">
        <SellerPerformanceTable 
          data={sellerPerformance} 
          loading={sellerPerfLoading} 
        />
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this product. The seller will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Images are unclear, price is too high, description is incomplete..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedProduct(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
