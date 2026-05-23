import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MapPin, Package2, ShoppingCart, CheckCircle, MoreVertical, Store as StoreIcon, Share2, Flag, Car, Bike, Smartphone } from 'lucide-react';
import { addToFavorites, removeFromFavorites, isInFavorites } from '@/db/api';
import { toast } from 'sonner';
import FranchiseBadge from '@/components/FranchiseBadge';
import BusinessTypeBadge from '@/components/BusinessTypeBadge';
import PurchaseOptionModal from '@/components/PurchaseOptionModal';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onFavoriteChange?: () => void;
  layout?: 'grid' | 'list';
  /** Distance in km from the user's selected location to this product's store */
  distanceKm?: number;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export default function ProductCard({ product, onFavoriteChange, layout = 'grid', distanceKm }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, product.id]);

  const checkFavoriteStatus = async () => {
    try {
      const status = await isInFavorites(product.id);
      setIsFavorite(status);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await removeFromFavorites(product.id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(product.id);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
      onFavoriteChange?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleViewStore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/stores/${product.store_id}`);
  };

  const handleShareProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productUrl = `${window.location.origin}/products/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} for ₹${product.price.toLocaleString('en-IN')}`,
          url: productUrl,
        });
        toast.success('Product shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(productUrl);
        toast.success('Product link copied to clipboard');
      } catch (error) {
        console.error('Failed to copy link:', error);
        toast.error('Failed to copy link');
      }
    }
  };

  const handleReportListing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Report feature coming soon');
    // TODO: Implement report functionality
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'TODAY';
    if (diffInDays === 1) return '1 DAY AGO';
    if (diffInDays < 7) return `${diffInDays} DAYS AGO`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} WEEKS AGO`;
    return `${Math.floor(diffInDays / 30)} MONTHS AGO`;
  };

  // Mobile-optimized horizontal list layout
  if (layout === 'list') {
    return (
      <Link to={`/products/${product.id}`}>
        <Card className="hover:shadow-md transition-shadow border-border">
          <div className="flex gap-0 relative">
            {/* Product Image */}
            <div className="relative w-32 h-32 shrink-0 overflow-hidden bg-muted">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Franchise Badge */}
              {product.store?.is_franchise && (
                <div className="absolute top-1 right-1">
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 font-bold">
                    ELITE
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 p-3 flex flex-col min-w-0">
              {/* Verified Badge & Price */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  {product.store?.is_franchise && (
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Verified User</span>
                    </div>
                  )}
                  <p className="text-xl font-bold text-foreground">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                </div>
                
                {/* Favorite Button */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-transparent"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                      }`}
                    />
                  </Button>

                  {/* Three-dot Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-transparent"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleViewStore}>
                        <StoreIcon className="mr-2 h-4 w-4" />
                        View Store
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareProduct}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Product
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleFavorite}>
                        <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        {isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleReportListing} className="text-destructive">
                        <Flag className="mr-2 h-4 w-4" />
                        Report Listing
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Product Title */}
              <h3 className="text-sm font-normal text-muted-foreground line-clamp-2 mb-2">
                {product.title}
              </h3>

              {/* Vehicle specs strip */}
              {(product.car_details || product.bike_details) && (() => {
                const specs = product.car_details ?? product.bike_details!;
                const Icon = product.car_details ? Car : Bike;
                return (
                  <div className="flex items-center flex-wrap gap-1 mb-2">
                    <Icon className="h-3 w-3 text-primary shrink-0" />
                    {specs.brand && (
                      <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-medium">{specs.brand}</span>
                    )}
                    {specs.year && (
                      <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{specs.year}</span>
                    )}
                    {specs.km_driven != null && (
                      <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{specs.km_driven.toLocaleString('en-IN')} km</span>
                    )}
                    {product.bike_details?.engine_cc && (
                      <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{product.bike_details.engine_cc} cc</span>
                    )}
                  </div>
                );
              })()}

              {/* Phone specs strip */}
              {product.phone_details && (product.phone_details.brand || product.phone_details.storage || product.phone_details.ram) && (
                <div className="flex items-center flex-wrap gap-1 mb-2">
                  <Smartphone className="h-3 w-3 text-primary shrink-0" />
                  {product.phone_details.brand && (
                    <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-medium">{product.phone_details.brand}</span>
                  )}
                  {product.phone_details.storage && (
                    <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{product.phone_details.storage}</span>
                  )}
                  {product.phone_details.ram && (
                    <span className="text-[11px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{product.phone_details.ram} RAM</span>
                  )}
                </div>
              )}

              {/* Location & Time */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{product.store?.location?.toUpperCase() || 'LOCATION'}</span>
                  {distanceKm !== undefined && (
                    <span className="shrink-0 ml-1 bg-primary/10 text-primary rounded px-1 py-0.5 font-medium whitespace-nowrap">
                      {formatDistance(distanceKm)}
                    </span>
                  )}
                </div>
                <span className="shrink-0 ml-2">{getTimeAgo(product.created_at)}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Desktop grid layout (original)
  return (
    <>
    <Link to={`/products/${product.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package2 className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Franchise Badge */}
          {product.store?.is_franchise && (
            <div className="absolute top-2 left-2">
              <FranchiseBadge variant="compact" />
            </div>
          )}
          
          {/* Favorite Button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform"
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'
              }`}
            />
          </Button>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1 mb-2">{product.title}</h3>
          <p className="text-2xl font-bold text-primary mb-2">
            ₹{product.price.toFixed(2)}
          </p>

          {/* Vehicle specs strip */}
          {(product.car_details || product.bike_details) && (() => {
            const specs = product.car_details ?? product.bike_details!;
            const Icon = product.car_details ? Car : Bike;
            return (
              <div className="flex items-center flex-wrap gap-1 mb-3">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                {specs.brand && (
                  <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">{specs.brand}</span>
                )}
                {specs.year && (
                  <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{specs.year}</span>
                )}
                {specs.km_driven != null && (
                  <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{specs.km_driven.toLocaleString('en-IN')} km</span>
                )}
                {product.bike_details?.engine_cc && (
                  <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{product.bike_details.engine_cc} cc</span>
                )}
              </div>
            );
          })()}

          {/* Phone specs strip */}
          {product.phone_details && (product.phone_details.brand || product.phone_details.storage || product.phone_details.ram) && (
            <div className="flex items-center flex-wrap gap-1 mb-3">
              <Smartphone className="h-3.5 w-3.5 text-primary shrink-0" />
              {product.phone_details.brand && (
                <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">{product.phone_details.brand}</span>
              )}
              {product.phone_details.storage && (
                <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{product.phone_details.storage}</span>
              )}
              {product.phone_details.ram && (
                <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{product.phone_details.ram} RAM</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1 flex-1">{product.store?.location}</span>
            {distanceKm !== undefined && (
              <span className="shrink-0 bg-primary/10 text-primary text-xs rounded px-1.5 py-0.5 font-medium whitespace-nowrap">
                {formatDistance(distanceKm)}
              </span>
            )}
          </div>
          
          {/* Business Type Badge */}
          {product.store?.business_type && (
            <div className="mb-3">
              <BusinessTypeBadge businessType={product.store.business_type} size="sm" />
            </div>
          )}
          
          <div className="flex gap-2">
            {product.store?.is_franchise && (product.store?.online_selling_enabled || product.store?.store_pickup_enabled) ? (
              // Franchise store with at least one purchase option enabled — show Buy Now button
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  const hasDelivery = !!product.store?.online_selling_enabled;
                  const hasPickup = product.store?.store_pickup_enabled !== false;
                  // Smart-route: skip modal when only one option is active
                  if (hasDelivery && !hasPickup) {
                    navigate(`/checkout/${product.id}`);
                  } else if (hasPickup && !hasDelivery) {
                    navigate(`/store-pickup/${product.id}`);
                  } else {
                    setPurchaseModalOpen(true);
                  }
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {product.store?.online_selling_enabled && !product.store?.store_pickup_enabled
                  ? 'Buy Now'
                  : !product.store?.online_selling_enabled && product.store?.store_pickup_enabled
                  ? 'Store Pickup'
                  : 'Buy Now'}
              </Button>
            ) : (
              // Non-franchise or online selling disabled - show View button
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/products/${product.id}`);
                }}
              >
                View
              </Button>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Badge variant="secondary" className="capitalize">
            {product.condition?.replace('_', ' ')}
          </Badge>
        </CardFooter>
      </Card>

    </Link>
    {/* Purchase option modal — MUST be outside <Link> to prevent link navigation on modal interactions */}
    <PurchaseOptionModal
      open={purchaseModalOpen}
      onOpenChange={setPurchaseModalOpen}
      productId={product.id}
      productTitle={product.title}
      productPrice={product.price}
      onlineSellingEnabled={!!product.store?.online_selling_enabled}
      storePickupEnabled={product.store?.store_pickup_enabled !== false}
    />
    </>
  );
}