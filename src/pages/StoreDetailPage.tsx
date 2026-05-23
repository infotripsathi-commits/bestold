import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Package2, Star, MessageSquare, Phone, UserPlus, UserCheck, StarIcon, ShieldCheck, CheckCircle, Award, MessageCircle } from 'lucide-react';
import { getStore, getProductsByStore, getReviewsByStore, getOrCreateConversation, followSeller, unfollowSeller, isFollowing, getFollowerCount, createReview, getReviewByBuyerAndStore } from '@/db/api';
import type { Store, Product, Review } from '@/types';
import { toast } from 'sonner';
import ShareStoreButton from '@/components/ShareStoreButton';
import ProductCard from '@/components/ProductCard';
import { ImageGalleryViewer } from '@/components/ui/image-gallery-viewer';
import FranchiseBadge from '@/components/FranchiseBadge';
import BusinessTypeBadge from '@/components/BusinessTypeBadge';
import { PageMeta } from '@/components/common/PageMeta';
import { buildLocalBusinessSchema, buildBreadcrumbSchema } from '@/lib/jsonld';

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [shopGalleryOpen, setShopGalleryOpen] = useState(false);
  const [bannerGalleryOpen, setBannerGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    // Scroll to top when component mounts or id changes
    window.scrollTo(0, 0);
    
    if (id) {
      loadStoreData();
    }
  }, [id]);

  const loadStoreData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [storeData, productsData, reviewsData] = await Promise.all([
        getStore(id),
        getProductsByStore(id),
        getReviewsByStore(id),
      ]);

      console.log('Store detail loaded:', storeData);
      setStore(storeData);
      setProducts(productsData);
      setReviews(reviewsData);

      // Load follower count and following status
      if (storeData) {
        const count = await getFollowerCount(storeData.seller_id);
        setFollowerCount(count);

        if (user && user.id !== storeData.seller_id) {
          const followStatus = await isFollowing(user.id, storeData.seller_id);
          setFollowing(followStatus);
          
          // Check if user has already reviewed this store
          const existingReview = await getReviewByBuyerAndStore(user.id, id);
          setUserReview(existingReview);
          if (existingReview) {
            setReviewRating(existingReview.rating);
            setReviewComment(existingReview.comment || '');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load store data:', error);
      toast.error('Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/stores/${id}` } });
      return;
    }

    if (!store) return;

    try {
      const conversation = await getOrCreateConversation({
        buyer_id: user.id,
        seller_id: store.seller_id,
        store_id: store.id,
      });

      navigate(`/chat?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleWhatsAppChat = () => {
    if (!store || !store.phone_number) {
      toast.error('Store phone number not available');
      return;
    }

    // Remove any non-digit characters from phone number
    const cleanPhone = store.phone_number.replace(/\D/g, '');
    
    // Create WhatsApp message
    const message = encodeURIComponent(
      `Hi! I'm interested in products from ${store.name} on BESTOLD. Can you help me?`
    );
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmitReview = async () => {
    console.log('handleSubmitReview called');
    console.log('User:', user);
    console.log('Store ID:', id);
    console.log('Rating:', reviewRating);
    console.log('Comment:', reviewComment);

    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login', { state: { from: `/stores/${id}` } });
      return;
    }

    if (!store || !id) {
      console.log('No store or id');
      return;
    }

    if (reviewRating === 0) {
      console.log('No rating selected');
      toast.error('Please select a rating');
      return;
    }

    setReviewSubmitting(true);
    try {
      console.log('Submitting review with data:', {
        store_id: id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });

      const result = await createReview({
        store_id: id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });

      console.log('Review submitted successfully:', result);
      toast.success('Review submitted successfully!');
      setReviewDialogOpen(false);
      
      // Reset form
      setReviewRating(0);
      setReviewComment('');
      
      // Reload store data to show the new review
      await loadStoreData();
    } catch (error: any) {
      console.error('Failed to submit review - Full error:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/stores/${id}` } });
      return;
    }

    if (!store) return;

    setFollowLoading(true);
    try {
      if (following) {
        await unfollowSeller(store.seller_id);
        setFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success('Unfollowed seller');
      } else {
        await followSeller(store.seller_id);
        setFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Following seller');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full mb-8 bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container py-16 text-center">
        <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
        <p className="text-muted-foreground mb-4">The store you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/search">Browse Stores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* JSON-LD Structured Data for this store */}
      <PageMeta
        title={`${store.name} — Second-Hand Store in ${store.location}`}
        description={store.description || `Browse quality second-hand goods from ${store.name} in ${store.location}. Trusted seller on BestOld.`}
        image={store.banner_image_url || undefined}
        type="website"
        schemas={[
          buildLocalBusinessSchema(store),
          buildBreadcrumbSchema([
            { name: 'Home', url: 'https://bestold.in/' },
            { name: 'Stores', url: 'https://bestold.in/stores' },
            { name: store.name, url: `https://bestold.in/stores/${store.id}` },
          ]),
        ]}
      />
      {/* Store Banner */}
      {store.banner_image_url && (
        <div 
          className="w-full h-48 md:h-64 lg:h-80 relative overflow-hidden bg-muted cursor-pointer"
          onClick={() => setBannerGalleryOpen(true)}
        >
          <img
            src={store.banner_image_url}
            alt={`${store.name} banner`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Banner Image Viewer */}
      {store.banner_image_url && (
        <ImageGalleryViewer
          images={[store.banner_image_url]}
          initialIndex={0}
          open={bannerGalleryOpen}
          onOpenChange={setBannerGalleryOpen}
        />
      )}

      <div className="container py-8">
        {/* Store Header */}
        <Card className={`mb-8 ${store.banner_image_url ? '-mt-16 relative z-10 border-2' : ''}`}>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h1 className="text-3xl font-bold">{store.name}</h1>
                  {store.is_franchise && <FranchiseBadge />}
                  {store.business_type && <BusinessTypeBadge businessType={store.business_type} />}
                </div>
                <p className="text-muted-foreground mb-4">{store.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{store.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{store.average_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({store.total_reviews} {store.total_reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span className="font-semibold">{followerCount}</span>
                    <span className="text-muted-foreground">
                      {followerCount === 1 ? 'follower' : 'followers'}
                    </span>
                  </div>
                </div>

                {store.contact_info && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Additional Contact: {store.contact_info}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {/* Share Store Button - visible to everyone */}
                <ShareStoreButton store={store} variant="outline" size="lg" />

                {user?.id !== store.seller_id && (
                  <>
                    <Button
                      onClick={handleToggleFollow}
                      variant={following ? 'default' : 'outline'}
                      size="lg"
                      disabled={followLoading}
                    >
                      {following ? (
                        <>
                          <UserCheck className="mr-2 h-5 w-5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" />
                          Follow Seller
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={handleWhatsAppChat} 
                      size="lg"
                      className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Chat on WhatsApp
                    </Button>
                    
                    {store.phone_number && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setShowPhone(!showPhone)}
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        {showPhone ? store.phone_number : 'Contact Seller'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Shop Images Gallery */}
            {store.shop_images && store.shop_images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Shop Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {store.shop_images.map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setShopGalleryOpen(true);
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Shop image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shop Images Gallery Viewer */}
            {store.shop_images && store.shop_images.length > 0 && (
              <ImageGalleryViewer
                images={store.shop_images}
                initialIndex={selectedImageIndex}
                open={shopGalleryOpen}
                onOpenChange={setShopGalleryOpen}
              />
            )}

            {/* Social Media Links */}
            {(store.youtube_url || store.facebook_url || store.instagram_url) && (
              <div className="mt-6 pt-6 border-t" data-social-version="v1.0">
                <h3 className="text-lg font-semibold mb-3">
                  Connect With Us
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(Social Media)</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {store.youtube_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={store.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        YouTube
                      </a>
                    </Button>
                  )}
                  {store.facebook_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={store.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </a>
                    </Button>
                  )}
                  {store.instagram_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={store.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Instagram
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* GPS Location */}
            {store.latitude && store.longitude && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Exact Location</p>
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Franchise Trust Indicator */}
        {store.is_franchise && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Verified Elite Partner
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This store is an authorized elite partner of BESTOLD, verified and approved by our platform administrators.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Secure Online Payments</p>
                        <p className="text-xs text-muted-foreground">All payments processed through platform UPI</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">7-Day Return Protection</p>
                        <p className="text-xs text-muted-foreground">Payment held securely for buyer protection</p>
                      </div>
                    </div>
                    {store.online_selling_enabled ? (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Buy Now Available</p>
                          <p className="text-xs text-muted-foreground">Instant online purchase with delivery</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Online Purchasing Unavailable</p>
                          <p className="text-xs text-muted-foreground">Contact seller directly to purchase</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-background rounded-lg border">
                    <p className="text-xs text-muted-foreground">
                      {store.online_selling_enabled ? (
                        <>
                          <strong>What this means for you:</strong> This elite partner store can accept online orders with Buy Now button. 
                          Your payment is held by the platform until delivery is confirmed. You have 7 days to request a return 
                          if the product doesn't match the description.
                        </>
                      ) : (
                        <>
                          <strong>What this means for you:</strong> Online purchasing is currently unavailable for this store. 
                          You can still browse products and contact the seller directly via chat or WhatsApp to make a purchase.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Listings ({products.length})</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active listings at the moment</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-8" />

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
            {user && user.id !== store.seller_id && !userReview && (
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Star className="mr-2 h-4 w-4" />
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with {store.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rating *</Label>
                      <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i + 1)}
                            className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          >
                            <Star
                              className={`h-8 w-8 cursor-pointer transition-colors ${
                                i < reviewRating
                                  ? 'fill-primary text-primary'
                                  : 'text-muted-foreground hover:text-primary'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comment (Optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Share your experience with this seller..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setReviewDialogOpen(false)}
                      disabled={reviewSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting || reviewRating === 0}
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {userReview && user && user.id !== store.seller_id && (
              <Badge variant="secondary" className="text-sm">
                You have already reviewed this store
              </Badge>
            )}
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.buyer?.full_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-primary text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground mt-2">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reviews yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
