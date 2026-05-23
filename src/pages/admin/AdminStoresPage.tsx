import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Store as StoreIcon, MapPin, Star, Pause, Play, Award, ShieldCheck, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { getAllStores, deleteStore, pauseStore, unpauseStore, toggleFranchiseStatus, toggleStorePickup } from '@/db/api';
import type { Store } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';
import FranchiseBadge from '@/components/FranchiseBadge';

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const storesData = await getAllStores(100);
      setStores(storesData);
    } catch (error) {
      console.error('Failed to load stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      await deleteStore(storeId);
      toast.success('Store deleted');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete store');
    }
  };

  const handlePauseStore = async (storeId: string) => {
    try {
      await pauseStore(storeId);
      toast.success('Store paused successfully');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause store');
    }
  };

  const handleUnpauseStore = async (storeId: string) => {
    try {
      await unpauseStore(storeId);
      toast.success('Store unpaused successfully');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unpause store');
    }
  };

  const handleToggleFranchise = async (storeId: string, currentStatus: boolean) => {
    try {
      await toggleFranchiseStatus(storeId, !currentStatus);
      toast.success(currentStatus ? 'Elite Partner status removed' : 'Store added as elite partner');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update elite partner status');
    }
  };

  const handleToggleStorePickup = async (storeId: string, currentEnabled: boolean) => {
    try {
      await toggleStorePickup(storeId, !currentEnabled);
      toast.success(currentEnabled ? 'Store pickup disabled for this store' : 'Store pickup enabled for this store');
      loadStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store pickup setting');
    }
  };

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="container py-8">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="min-h-screen py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8">Store Management</h1>

        <div className="space-y-4">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StoreIcon className="h-5 w-5 text-primary" />
                      <Link
                        to={`/stores/${store.id}`}
                        className="text-lg font-semibold hover:text-primary"
                      >
                        {store.name}
                      </Link>
                      {store.is_franchise && <FranchiseBadge variant="compact" />}
                      <Badge
                        variant={store.store_pickup_enabled !== false ? 'default' : 'secondary'}
                        className={`text-xs ${store.store_pickup_enabled !== false ? 'bg-amber-500 hover:bg-amber-500 text-white' : 'text-muted-foreground'}`}
                      >
                        {store.store_pickup_enabled !== false ? '🏪 Pickup ON' : '🏪 Pickup OFF'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {store.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{store.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span>{store.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({store.total_reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Seller: {store.seller?.full_name} ({store.seller?.email})
                    </p>
                    {store.approval_status && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          store.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                          store.approval_status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          store.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {store.approval_status.charAt(0).toUpperCase() + store.approval_status.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Franchise Toggle */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant={store.is_franchise ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                        >
                          {store.is_franchise ? (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Elite Partner
                            </>
                          ) : (
                            <>
                              <Award className="h-4 w-4 mr-1" />
                              Make Elite Partner
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {store.is_franchise ? 'Remove Elite Partner Status' : 'Add as Elite Partner'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {store.is_franchise 
                              ? 'This will remove Elite Partner status. The store will no longer be able to sell online with Buy Now button.'
                              : 'This will grant Elite Partner status to this store. They will be able to sell online and receive payouts through the platform.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleToggleFranchise(store.id, store.is_franchise)}>
                            {store.is_franchise ? 'Remove' : 'Grant'} Elite Partner Status
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Pause/Unpause */}
                    {store.approval_status === 'approved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePauseStore(store.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {store.approval_status === 'paused' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnpauseStore(store.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Unpause
                      </Button>
                    )}

                    {/* Store Pickup Toggle */}
                    <Button
                      variant={store.store_pickup_enabled !== false ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full ${store.store_pickup_enabled !== false ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : ''}`}
                      onClick={() => handleToggleStorePickup(store.id, store.store_pickup_enabled !== false)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      {store.store_pickup_enabled !== false ? 'Pickup: ON' : 'Pickup: OFF'}
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Store</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this store? This will also delete all products and related data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteStore(store.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
