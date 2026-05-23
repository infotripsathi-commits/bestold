import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { Package2, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getStoreByUserId, getProductsByStoreForSeller, deleteProduct, updateProduct } from '@/db/api';
import type { Product, Store } from '@/types';
import VehicleSpecsBadges from '@/components/VehicleSpecsBadges';

export default function ProductManagementPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const storeData = await getStoreByUserId(user.id);
      setStore(storeData);

      if (storeData) {
        const productsData = await getProductsByStoreForSeller(storeData.id);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleMarkAsSold = async (productId: string) => {
    try {
      await updateProduct(productId, { status: 'sold' });
      toast.success('Product marked as sold');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
            <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Create Your Store First</h2>
            <p className="text-muted-foreground mb-6">
              You need to create a store before you can add products
            </p>
            <Button asChild size="lg">
              <Link to="/seller/store">Create Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Manage Products</h1>
          <Button asChild className={store.approval_status === 'approved' ? '' : 'invisible pointer-events-none'}>
            <Link to="/seller/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{product.title}</h3>
                          <p className="text-2xl font-bold text-primary">
                            ₹{product.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {product.condition?.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {product.status}
                          </Badge>
                        </div>
                      </div>

                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {product.description}
                        </p>
                      )}

                      <VehicleSpecsBadges product={product} />

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/seller/products/${product.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>

                        {product.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsSold(product.id)}
                          >
                            Mark as Sold
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this product? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start adding products to your store
              </p>
              <Button asChild>
                <Link to="/seller/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
