import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Package2, MessageSquare, Store as StoreIcon, Phone, Heart, MessageCircle, Share2, Copy, Mail, Check, Car, Bike, Gauge, Fuel, Calendar, Users, Zap, Smartphone, HardDrive, Cpu } from 'lucide-react';
import { getProduct, getProductsByStore, getOrCreateConversation, addToFavorites, removeFromFavorites, isInFavorites, trackProductView } from '@/db/api';
import { trackAnalyticsEvent } from '@/db/analytics';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { ImageGalleryViewer } from '@/components/ui/image-gallery-viewer';
import { PageMeta } from '@/components/common/PageMeta';
import { buildProductSchema, buildBreadcrumbSchema } from '@/lib/jsonld';
import PurchaseOptionModal from '@/components/PurchaseOptionModal';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts or id changes
    window.scrollTo(0, 0);
    
    if (id) {
      loadProductData();
      checkFavoriteStatus();
    }
  }, [id]);

  const checkFavoriteStatus = async () => {
    if (!id || !user) return;
    try {
      const status = await isInFavorites(id);
      setIsFavorite(status);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const loadProductData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const productData = await getProduct(id);
      setProduct(productData);

      // Track product view for analytics
      if (productData) {
        trackAnalyticsEvent(id, 'view');
        
        // Track product view for personalized recommendations
        if (productData.category_id) {
          trackProductView(
            id,
            productData.category_id,
            productData.subcategory_id || undefined
          );
        }
      }

      if (productData?.store_id) {
        const related = await getProductsByStore(productData.store_id, 4);
        setRelatedProducts(related.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product information');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    if (!product?.store) return;

    // Track chat click
    if (id) {
      trackAnalyticsEvent(id, 'chat_click');
    }

    try {
      const conversation = await getOrCreateConversation({
        buyer_id: user.id,
        seller_id: product.store.seller_id,
        store_id: product.store_id,
        product_id: product.id,
      });

      navigate(`/chat?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    if (!id) return;

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await removeFromFavorites(id);
        setIsFavorite(false);
        trackAnalyticsEvent(id, 'favorite_remove');
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(id);
        setIsFavorite(true);
        trackAnalyticsEvent(id, 'favorite_add');
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!product?.store?.phone_number) {
      toast.error('Phone number not available');
      return;
    }

    // Track WhatsApp click
    if (id) {
      trackAnalyticsEvent(id, 'whatsapp_click');
    }

    // Remove any non-digit characters from phone number
    const cleanPhone = product.store.phone_number.replace(/\D/g, '');
    
    // Create WhatsApp message template
    const productUrl = `${window.location.origin}/products/${product.id}`;
    const message = `Hi! I'm interested in this product:\n\n*${product.title}*\nPrice: ₹${product.price.toLocaleString('en-IN')}\n\nLink: ${productUrl}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (!product) return;

    // Track share click
    if (id) {
      trackAnalyticsEvent(id, 'share_click');
    }

    const productUrl = `${window.location.origin}/products/${product.id}`;
    const shareData = {
      title: product.title,
      text: `Check out this ${product.title} for ₹${product.price.toLocaleString('en-IN')} on BESTOLD`,
      url: productUrl,
    };

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to custom dialog
      setShareDialogOpen(true);
    }
  };

  const handleCopyLink = async () => {
    if (!product) return;

    const productUrl = `${window.location.origin}/products/${product.id}`;
    
    try {
      await navigator.clipboard.writeText(productUrl);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleSocialShare = (platform: string) => {
    if (!product) return;

    const productUrl = `${window.location.origin}/products/${product.id}`;
    const title = encodeURIComponent(product.title);
    const description = encodeURIComponent(`Check out this ${product.title} for ₹${product.price.toLocaleString('en-IN')} on BESTOLD`);
    
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${description}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        // Use whatsapp:// protocol for better mobile compatibility
        // Falls back to web.whatsapp.com for desktop
        const whatsappText = `${description}%20${encodeURIComponent(productUrl)}`;
        shareUrl = `whatsapp://send?text=${whatsappText}`;
        
        // Try to open WhatsApp, fallback to web version if app not installed
        const whatsappWindow = window.open(shareUrl, '_blank');
        
        // If the app didn't open (desktop or app not installed), use web version
        setTimeout(() => {
          if (!whatsappWindow || whatsappWindow.closed) {
            window.open(`https://web.whatsapp.com/send?text=${whatsappText}`, '_blank', 'width=600,height=400');
          }
        }, 500);
        
        return; // Early return to avoid the generic window.open below
        break;
      case 'email':
        shareUrl = `mailto:?subject=${title}&body=${description}%20${encodeURIComponent(productUrl)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16 text-center">
        <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/search">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${product.title} - ₹${product.price.toLocaleString('en-IN')} | BESTOLD`}
        description={product.description || `Buy ${product.title} for ₹${product.price.toLocaleString('en-IN')} on BESTOLD. ${product.condition ? `Condition: ${product.condition.replace('_', ' ')}` : ''}`}
        image={product.images && product.images.length > 0 ? product.images[0] : undefined}
        type="product"
        additionalMeta={[
          { property: 'og:price:amount', content: product.price.toString() },
          { property: 'og:price:currency', content: 'INR' },
          { property: 'product:condition', content: product.condition || 'used' },
          { property: 'product:availability', content: product.status === 'active' ? 'in stock' : 'out of stock' },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: product.title },
          { name: 'twitter:description', content: product.description || `Buy ${product.title} for ₹${product.price.toLocaleString('en-IN')}` },
          { name: 'twitter:image', content: product.images && product.images.length > 0 ? product.images[0] : '' },
        ]}
        schemas={[
          buildProductSchema(product),
          buildBreadcrumbSchema([
            { name: 'Home', url: 'https://bestold.in/' },
            ...(product.category ? [{ name: product.category.name, url: 'https://bestold.in/categories' }] : []),
            { name: product.title, url: `https://bestold.in/products/${product.id}` },
          ]),
        ]}
      />
      <div className="min-h-screen py-8">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {product.images.map((image: string, index: number) => (
                    <CarouselItem key={index}>
                      <div 
                        className="aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setGalleryOpen(true);
                        }}
                      >
                        <img
                          src={image}
                          alt={`${product.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {product.images.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                <Package2 className="h-24 w-24 text-muted-foreground" />
              </div>
            )}

            {/* Image Gallery Viewer */}
            {product.images && product.images.length > 0 && (
              <ImageGalleryViewer
                images={product.images}
                initialIndex={selectedImageIndex}
                open={galleryOpen}
                onOpenChange={setGalleryOpen}
              />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-4xl font-bold text-primary mb-4">
                ₹{product.price.toFixed(2)}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {product.condition?.replace('_', ' ')}
                </Badge>
                {product.category && (
                  <Badge variant="outline">{product.category.name}</Badge>
                )}
                <Badge
                  variant={product.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {product.status}
                </Badge>
              </div>
            </div>

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* ── Vehicle Specs Card ── */}
            {(product.car_details || product.bike_details) && (() => {
              const isCar = !!product.car_details;
              const specs = product.car_details ?? product.bike_details!;
              const VehicleIcon = isCar ? Car : Bike;
              const label = isCar ? 'Car Details' : 'Bike Details';

              const rows: { icon: React.ReactNode; label: string; value: string }[] = [
                specs.brand
                  ? { icon: <VehicleIcon className="h-4 w-4" />, label: 'Brand', value: specs.brand }
                  : null,
                specs.year
                  ? { icon: <Calendar className="h-4 w-4" />, label: 'Year', value: String(specs.year) }
                  : null,
                specs.km_driven != null
                  ? { icon: <Gauge className="h-4 w-4" />, label: 'KM Driven', value: `${specs.km_driven.toLocaleString('en-IN')} km` }
                  : null,
                isCar && product.car_details?.fuel
                  ? { icon: <Fuel className="h-4 w-4" />, label: 'Fuel', value: product.car_details.fuel }
                  : null,
                isCar && product.car_details?.transmission
                  ? { icon: <Zap className="h-4 w-4" />, label: 'Transmission', value: product.car_details.transmission.charAt(0).toUpperCase() + product.car_details.transmission.slice(1) }
                  : null,
                !isCar && product.bike_details?.engine_cc
                  ? { icon: <Zap className="h-4 w-4" />, label: 'Engine CC', value: `${product.bike_details.engine_cc} cc` }
                  : null,
                !isCar && product.bike_details?.fuel
                  ? { icon: <Fuel className="h-4 w-4" />, label: 'Fuel', value: product.bike_details.fuel }
                  : null,
                specs.no_of_owners
                  ? { icon: <Users className="h-4 w-4" />, label: 'Owners', value: String(specs.no_of_owners) }
                  : null,
              ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

              if (rows.length === 0) return null;

              return (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <VehicleIcon className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">{label}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {rows.map(({ icon, label: rowLabel, value }) => (
                        <div key={rowLabel} className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground leading-none mb-0.5">{rowLabel}</p>
                            <p className="text-sm font-medium truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* ── Phone Specs Card ── */}
            {product.phone_details && (() => {
              const pd = product.phone_details!;
              const rows: { icon: React.ReactNode; label: string; value: string }[] = [
                pd.brand
                  ? { icon: <Smartphone className="h-4 w-4" />, label: 'Brand', value: pd.brand }
                  : null,
                pd.storage
                  ? { icon: <HardDrive className="h-4 w-4" />, label: 'Storage', value: pd.storage }
                  : null,
                pd.ram
                  ? { icon: <Cpu className="h-4 w-4" />, label: 'RAM', value: pd.ram }
                  : null,
              ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

              if (rows.length === 0) return null;

              return (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Mobile Details</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {rows.map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
                            <p className="text-sm font-medium truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Store Info */}
            {product.store && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StoreIcon className="h-5 w-5 text-primary" />
                        <Link
                          to={`/stores/${product.store.id}`}
                          className="text-lg font-semibold hover:text-primary"
                        >
                          {product.store.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{product.store.location}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Button */}
            {product.status === 'active' && (!user || user?.id !== product.store?.seller_id) && (
              <Card>
                <CardContent className="p-6 space-y-3">
                  {product.store?.is_franchise ? (
                    // Franchise store — show purchase button(s) based on which options are enabled
                    <>
                      {(() => {
                        const hasDelivery = !!product.store?.online_selling_enabled;
                        const hasPickup = product.store?.store_pickup_enabled !== false;
                        const hasAnyPurchaseOption = hasDelivery || hasPickup;

                        const handlePurchaseClick = () => {
                          if (id) trackAnalyticsEvent(id, 'buy_click');
                          if (!user) { navigate('/login'); return; }
                          // Smart-route: skip modal when only one option is active
                          if (hasDelivery && !hasPickup) {
                            navigate(`/checkout/${product.id}`);
                          } else if (hasPickup && !hasDelivery) {
                            navigate(`/store-pickup/${product.id}`);
                          } else {
                            setPurchaseModalOpen(true);
                          }
                        };

                        return (
                          <>
                            {hasAnyPurchaseOption ? (
                              <Button onClick={handlePurchaseClick} size="lg" className="w-full">
                                <Package2 className="mr-2 h-5 w-5" />
                                {hasDelivery && !hasPickup
                                  ? 'Buy Now'
                                  : !hasDelivery && hasPickup
                                  ? 'Store Pickup'
                                  : 'Buy Now'}
                              </Button>
                            ) : (
                              <div className="p-4 bg-muted rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">
                                  Online purchasing is currently unavailable for this store. Please contact the seller directly.
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <Button onClick={handleContactSeller} variant="outline" size="lg" className="w-full">
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Chat
                              </Button>
                              <Button
                                onClick={handleWhatsAppContact}
                                variant="outline"
                                size="lg"
                                className="w-full border-green-600 text-green-600 hover:bg-green-50"
                              >
                                <MessageCircle className="mr-2 h-5 w-5" />
                                WhatsApp
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    // Non-franchise store - show Call Now and WhatsApp buttons
                    <>
                      {!showPhone ? (
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={() => setShowPhone(true)} 
                            size="lg" 
                            className="w-full"
                          >
                            <Phone className="mr-2 h-5 w-5" />
                            Call Now
                          </Button>
                          <Button 
                            onClick={handleWhatsAppContact} 
                            size="lg" 
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                          <MessageCircle className="mr-2 h-5 w-5" />
                          WhatsApp
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Card className="border-primary">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Store Phone Number</p>
                                <a 
                                  href={`tel:${product.store?.phone_number}`}
                                  className="text-xl font-bold text-primary hover:underline"
                                >
                                  {product.store?.phone_number || 'Not available'}
                                </a>
                              </div>
                              <Phone className="h-8 w-8 text-primary" />
                            </div>
                          </CardContent>
                        </Card>
                        <Button 
                          onClick={handleWhatsAppContact} 
                          size="lg" 
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <MessageCircle className="mr-2 h-5 w-5" />
                          Chat on WhatsApp
                        </Button>
                      </>
                    )}
                    <Button onClick={handleContactSeller} variant="outline" size="lg" className="w-full">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Chat with Seller
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleToggleFavorite}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={favoriteLoading}
                >
                  <Heart
                    className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : ''}`}
                  />
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
                
                {/* Share Button */}
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Share2 className="mr-2 h-5 w-5" />
                      Share Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Share this product</DialogTitle>
                      <DialogDescription>
                        Share via social media or copy the link
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('facebook')}
                        className="w-full"
                      >
                        <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('twitter')}
                        className="w-full"
                      >
                        <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        Twitter
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('linkedin')}
                        className="w-full"
                      >
                        <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('whatsapp')}
                        className="w-full"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('email')}
                        className="w-full"
                      >
                        <Mail className="mr-2 h-5 w-5" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        className="w-full"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="mr-2 h-5 w-5 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-5 w-5" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </CardContent>
              </Card>
            )}

            {product.status === 'sold' && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="font-semibold">This item has been sold</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">More from this store</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} to={`/products/${relatedProduct.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-square overflow-hidden bg-muted">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <img
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1 mb-2">
                        {relatedProduct.title}
                      </h3>
                      <p className="text-xl font-bold text-primary">
                        ₹{relatedProduct.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Purchase Option Modal - Buy Now vs Store Pickup */}
      {product && (
        <PurchaseOptionModal
          open={purchaseModalOpen}
          onOpenChange={setPurchaseModalOpen}
          productId={product.id}
          productTitle={product.title}
          productPrice={product.price}
          onlineSellingEnabled={!!product.store?.online_selling_enabled}
          storePickupEnabled={product.store?.store_pickup_enabled !== false}
        />
      )}
    </>
  );
}
