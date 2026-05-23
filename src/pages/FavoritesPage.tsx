import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFromFavorites } from '@/db/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FavoriteProduct {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
    stores: {
      id: string;
      name: string;
    };
  } | null;
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await getFavorites() as unknown as FavoriteProduct[];
      // Filter out any favorites with null products
      const validFavorites = data.filter((fav) => fav.products !== null);
      setFavorites(validFavorites);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      setRemovingId(productId);
      await removeFromFavorites(productId);
      setFavorites(favorites.filter(fav => fav.product_id !== productId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      toast.error('Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <h1 className="text-2xl font-bold">My Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground text-center mb-6">
              Start adding products to your favorites to see them here
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((favorite) => {
            const product = favorite.products;
            if (!product) return null;
            
            const isUnavailable = product.status !== 'active';
            const imageUrl = product.images?.[0] || '/placeholder-product.jpg';

            return (
              <Card
                key={favorite.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div
                  onClick={() => !isUnavailable && handleProductClick(product.id)}
                  className={isUnavailable ? 'opacity-60' : ''}
                >
                  <div className="relative aspect-square">
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          No longer available
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {product.title}
                    </h3>
                    <p className="text-primary font-bold text-lg mb-2">
                      ₹{product.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <StoreIcon className="h-3 w-3" />
                      <span className="truncate">{product.stores.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product.id);
                      }}
                      disabled={removingId === product.id}
                    >
                      {removingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-1 fill-primary text-primary" />
                          Remove
                        </>
                      )}
                    </Button>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
