import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getActiveBanners, getFeaturedStoresByLocation } from '@/db/api';
import { toast } from 'sonner';
import type { StoreBanner, FeaturedStoreDisplay } from '@/types';

export default function BannerCarousel() {
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [featuredStores, setFeaturedStores] = useState<FeaturedStoreDisplay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);

  useEffect(() => {
    loadBanners();
    detectLocationAndLoadFeaturedStores();
  }, []);

  useEffect(() => {
    const totalSlides = banners.length + featuredStores.length;
    if (totalSlides === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length, featuredStores.length]);

  const loadBanners = async () => {
    try {
      const data = await getActiveBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectLocationAndLoadFeaturedStores = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      setLocationDetected(true);

      // Load featured stores within 50km
      const stores = await getFeaturedStoresByLocation(latitude, longitude, 50);
      setFeaturedStores(stores);
      
      if (stores.length > 0) {
        console.log(`Loaded ${stores.length} featured stores within 50km`);
      }
    } catch (error) {
      console.log('Location detection failed or denied:', error);
      // Silently fail - just don't show featured stores
    }
  };

  const goToPrevious = () => {
    const totalSlides = banners.length + featuredStores.length;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    const totalSlides = banners.length + featuredStores.length;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const allSlides = [
    ...featuredStores.map(store => ({ type: 'featured' as const, data: store })),
    ...banners.map(banner => ({ type: 'banner' as const, data: banner })),
  ];

  if (loading || allSlides.length === 0) {
    return null;
  }

  const currentSlide = allSlides[currentIndex];

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {allSlides.map((slide, index) => {
            if (slide.type === 'featured') {
              const store = slide.data as FeaturedStoreDisplay;
              return (
                <Link
                  key={`featured-${store.store_id}`}
                  to={`/stores/${store.store_id}`}
                  className="min-w-full"
                >
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="relative aspect-[16/6] md:aspect-[21/6]">
                      <img
                        src={store.banner_url || store.store_logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8'}
                        alt={store.store_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                        <div className="p-6 text-white w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              Featured Store
                            </Badge>
                            {store.distance_km !== undefined && (
                              <Badge variant="outline" className="bg-background/20 text-white border-white/40">
                                <MapPin className="h-3 w-3 mr-1" />
                                {store.distance_km < 1 
                                  ? `${(store.distance_km * 1000).toFixed(0)}m away`
                                  : `${store.distance_km.toFixed(1)}km away`
                                }
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-2xl md:text-3xl font-bold mb-2">
                            {store.store_name}
                          </h3>
                          {store.store_description && (
                            <p className="text-sm md:text-base opacity-90 line-clamp-2">
                              {store.store_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            } else {
              const banner = slide.data as StoreBanner;
              return (
                <Link
                  key={`banner-${banner.id}`}
                  to={`/stores/${banner.store_id}`}
                  className="min-w-full"
                >
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="relative aspect-[16/6] md:aspect-[21/6]">
                      <img
                        src={banner.banner_image_url}
                        alt={banner.title || banner.store?.name || 'Store banner'}
                        className="w-full h-full object-cover"
                      />
                      {(banner.title || banner.description) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                          <div className="p-6 text-white w-full">
                            {banner.title && (
                              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                                {banner.title}
                              </h3>
                            )}
                            {banner.description && (
                              <p className="text-sm md:text-base opacity-90 line-clamp-2">
                                {banner.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            }
          })}
        </div>

        {/* Navigation Buttons */}
        {allSlides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                goToNext();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {allSlides.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {allSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
