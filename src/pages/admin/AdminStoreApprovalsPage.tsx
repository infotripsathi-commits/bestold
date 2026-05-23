import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, MapPin, Phone, FileText, Image as ImageIcon, Store as StoreIcon, ChevronLeft, ChevronRight, X, ArrowRight, UserPlus } from 'lucide-react';
import { getPendingStores, getAllStoresForAdmin, approveStore, rejectStore, getAllSellerApplications } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Store } from '@/types';
import { toast } from 'sonner';
import AdminNav from '@/components/layouts/AdminNav';

export default function AdminStoreApprovalsPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pendingSellerAppsCount, setPendingSellerAppsCount] = useState(0);

  useEffect(() => {
    loadStores();
    loadSellerApplicationsCount();
  }, [activeTab]);

  const loadSellerApplicationsCount = async () => {
    try {
      const applications = await getAllSellerApplications('pending');
      setPendingSellerAppsCount(applications.length);
    } catch (error) {
      console.error('Failed to load seller applications count:', error);
    }
  };

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await getAllStoresForAdmin();
      setStores(data);
    } catch (error) {
      console.error('Failed to load stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storeId: string) => {
    if (!user) return;
    
    setProcessing(true);
    try {
      await approveStore(storeId, user.id);
      toast.success('Store approved successfully');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve store');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (store: Store) => {
    setSelectedStore(store);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!user || !selectedStore || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await rejectStore(selectedStore.id, user.id, rejectionReason);
      toast.success('Store rejected');
      setRejectDialogOpen(false);
      setSelectedStore(null);
      setRejectionReason('');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject store');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewImages = (images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setImageGalleryOpen(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const filteredStores = stores.filter(store => {
    if (activeTab === 'all') return true;
    return store.approval_status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">Store Approvals</h1>
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-muted" />
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
            <h1 className="text-3xl font-bold">Store Approvals</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve seller store applications
            </p>
          </div>

          {/* Seller Applications Notice */}
          {pendingSellerAppsCount > 0 && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {pendingSellerAppsCount} Pending Seller Application{pendingSellerAppsCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Users waiting to become sellers
                      </p>
                    </div>
                  </div>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/admin/seller-applications">
                      Review Applications
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({stores.filter(s => s.approval_status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stores.filter(s => s.approval_status === 'approved').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stores.filter(s => s.approval_status === 'rejected').length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({stores.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {filteredStores.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <StoreIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground">No stores found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredStores.map((store) => (
                  <Card key={store.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 flex-wrap">
                            {store.name}
                            {getStatusBadge(store.approval_status)}
                            {store.resubmission_count && store.resubmission_count > 0 && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                                🔄 Resubmitted ({store.resubmission_count}x)
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Seller: {store.seller?.full_name} ({store.seller?.email})
                          </CardDescription>
                          <CardDescription className="text-xs">
                            Applied: {new Date(store.created_at).toLocaleString()}
                          </CardDescription>
                          {store.last_resubmitted_at && (
                            <CardDescription className="text-xs text-orange-600 font-medium">
                              Last Resubmitted: {new Date(store.last_resubmitted_at).toLocaleString()}
                            </CardDescription>
                          )}
                        </div>
                        {store.approval_status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(store.id)}
                              disabled={processing}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectClick(store)}
                              disabled={processing}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Store Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span>{store.location}</span>
                            </div>
                            {store.phone_number && (
                              <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{store.phone_number}</span>
                              </div>
                            )}
                            {store.description && (
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span className="line-clamp-3">{store.description}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Documents & Images</h4>
                          <div className="space-y-2">
                            {store.banner_image_url && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Store Banner</Label>
                                <button
                                  onClick={() => handleViewImages([store.banner_image_url!])}
                                  className="block w-full cursor-pointer group"
                                >
                                  <img
                                    src={store.banner_image_url}
                                    alt="Store Banner"
                                    className="w-full h-32 object-cover rounded-lg border hover:border-primary transition-colors"
                                  />
                                  <div className="text-xs text-center text-muted-foreground group-hover:text-primary mt-1 transition-colors">
                                    Click to view full size
                                  </div>
                                </button>
                              </div>
                            )}
                            {store.trade_license_url && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Trade License</Label>
                                <button
                                  onClick={() => handleViewImages([store.trade_license_url!])}
                                  className="block w-full cursor-pointer group"
                                >
                                  <img
                                    src={store.trade_license_url}
                                    alt="Trade License"
                                    className="w-full h-32 object-cover rounded-lg border hover:border-primary transition-colors"
                                  />
                                  <div className="text-xs text-center text-muted-foreground group-hover:text-primary mt-1 transition-colors">
                                    Click to view full size
                                  </div>
                                </button>
                              </div>
                            )}
                            {store.shop_images && store.shop_images.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs text-muted-foreground">Shop Images ({store.shop_images.length})</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleViewImages(store.shop_images || [])}
                                  >
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                    View All
                                  </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                  {store.shop_images.slice(0, 3).map((img, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleViewImages(store.shop_images || [], idx)}
                                      className="relative group cursor-pointer"
                                    >
                                      <img
                                        src={img}
                                        alt={`Shop ${idx + 1}`}
                                        className="w-full h-20 object-cover rounded border hover:border-primary transition-colors"
                                      />
                                      {idx === 2 && store.shop_images.length > 3 && (
                                        <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                                          <span className="text-white font-semibold text-sm">
                                            +{store.shop_images.length - 3} more
                                          </span>
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {store.approval_status === 'rejected' && store.rejection_reason && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                          <h4 className="font-semibold text-destructive mb-2">Rejection Reason</h4>
                          <p className="text-sm">{store.rejection_reason}</p>
                        </div>
                      )}

                      {store.approval_status === 'approved' && store.approved_at && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Approved on {new Date(store.approved_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Store Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedStore?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this store application is being rejected..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processing || !rejectionReason.trim()}
            >
              Reject Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Dialog */}
      <Dialog open={imageGalleryOpen} onOpenChange={setImageGalleryOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0">
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <DialogTitle>
                  Image {currentImageIndex + 1} of {galleryImages.length}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImageGalleryOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main Image */}
            <div className="flex-1 relative bg-muted/30 flex items-center justify-center p-4">
              {galleryImages.length > 0 && (
                <img
                  src={galleryImages[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="border-t p-4 bg-background">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Download/Open in New Tab */}
            <div className="border-t p-4 bg-background flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(galleryImages[currentImageIndex], '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
