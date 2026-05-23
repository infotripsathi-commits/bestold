import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, Package2, Navigation, Grid3x3, Loader2, Award } from 'lucide-react';
import { getFeaturedProducts, getCategories, getOrCreateLocation } from '@/db/api';
import { fetchLocations, detectUserLocation } from '@/lib/locations';
import { calculateDistance } from '@/utils/distance';
import BannerCarousel from '@/components/BannerCarousel';
import SellPhoneButton from '@/components/SellPhoneButton';
import FeedbackButton from '@/components/FeedbackButton';
import ProductCard from '@/components/ProductCard';
import { PageMeta } from '@/components/common/PageMeta';
import type { Product, Category } from '@/types';
import { toast } from 'sonner';

// Location search result type
interface LocationSearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string; latitude?: number; longitude?: number; radius_km?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  
  // Location search states
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showLocationSearchResults, setShowLocationSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    loadData();
  }, []);

  // Auto-detect location after locations are loaded
  // DISABLED: Don't auto-select location, show all products by default
  // useEffect(() => {
  //   if (locations.length > 0) {
  //     autoDetectLocation();
  //   }
  // }, [locations]);

  // Reload products ONLY when user manually changes location
  useEffect(() => {
    // Skip the initial load - products are already loaded in loadData()
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Only reload if locations are loaded
    if (locations.length > 0) {
      loadProductsByLocation();
    }
  }, [selectedLocation]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('HomePage: Starting to load data...');
      
      const [products, cats, locs] = await Promise.all([
        getFeaturedProducts(1000), // Load all products (increased limit)
        getCategories(),
        fetchLocations(),
      ]);
      
      console.log('HomePage: Data loaded successfully', {
        productsCount: products.length,
        categoriesCount: cats.length,
        locationsCount: locs.length,
      });
      
      setFeaturedProducts(products);
      setCategories(cats);
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByLocation = async () => {
    try {
      console.log('Loading products for location:', selectedLocation);

      if (selectedLocation === 'all') {
        const products = await getFeaturedProducts(1000);
        setFeaturedProducts(products);
        return;
      }

      const loc = locations.find(l => l.value === selectedLocation);

      // Prefer coordinate-based radius filtering (same as GPS mode)
      if (loc?.latitude && loc?.longitude) {
        const lat = loc.latitude;
        const lng = loc.longitude;
        const radiusKm = loc.radius_km ?? 50; // use DB-configured radius, default 50km

        // Update gpsLocation so distance badges render correctly
        setGpsLocation(prev => ({ lat, lng, address: prev?.address ?? loc.label }));

        const allProducts = await getFeaturedProducts(1000);
        const nearbyProducts = allProducts.filter(product => {
          if (!product.store?.latitude || !product.store?.longitude) return false;
          const storeLat = typeof product.store.latitude === 'string'
            ? parseFloat(product.store.latitude)
            : product.store.latitude;
          const storeLng = typeof product.store.longitude === 'string'
            ? parseFloat(product.store.longitude)
            : product.store.longitude;
          if (isNaN(storeLat) || isNaN(storeLng)) return false;
          return calculateDistance(lat, lng, storeLat, storeLng) <= radiusKm;
        });

        // Sort nearest first
        nearbyProducts.sort((a, b) => {
          const latA = typeof a.store!.latitude === 'string' ? parseFloat(a.store!.latitude!) : a.store!.latitude!;
          const lngA = typeof a.store!.longitude === 'string' ? parseFloat(a.store!.longitude!) : a.store!.longitude!;
          const latB = typeof b.store!.latitude === 'string' ? parseFloat(b.store!.latitude!) : b.store!.latitude!;
          const lngB = typeof b.store!.longitude === 'string' ? parseFloat(b.store!.longitude!) : b.store!.longitude!;
          return calculateDistance(lat, lng, latA, lngA) - calculateDistance(lat, lng, latB, lngB);
        });

        setFeaturedProducts(nearbyProducts);
        console.log(`Loaded ${nearbyProducts.length} products within ${radiusKm}km of ${loc.label}`);
      } else {
        // Fallback: label-based text match (for locations without coordinates)
        const locationLabel = loc?.label;
        const products = await getFeaturedProducts(1000, locationLabel);
        setFeaturedProducts(products);
        console.log(`Loaded ${products.length} products for location (label match):`, locationLabel || 'all');
      }
    } catch (error) {
      console.error('Failed to load products by location:', error);
    }
  };

  // Auto-detect location on first visit
  const autoDetectLocation = async () => {
    // Check if location was already detected and stored
    const storedLocation = localStorage.getItem('userLocation');
    const locationTimestamp = localStorage.getItem('locationTimestamp');
    
    // If location was detected within last 7 days, use it
    if (storedLocation && locationTimestamp) {
      const daysSinceDetection = (Date.now() - parseInt(locationTimestamp)) / (1000 * 60 * 60 * 24);
      if (daysSinceDetection < 7) {
        setSelectedLocation(storedLocation);
        console.log('Using stored location:', storedLocation);
        return;
      }
    }

    // Auto-detect location for new visitors or after 7 days
    console.log('Starting automatic location detection...');
    try {
      setDetectingLocation(true);
      
      // Use the proper detectUserLocation function with GPS distance calculation
      const detectedLocationValue = await detectUserLocation();
      
      if (detectedLocationValue) {
        const matchedLocation = locations.find(loc => loc.value === detectedLocationValue);
        
        if (matchedLocation) {
          setSelectedLocation(detectedLocationValue);
          localStorage.setItem('userLocation', detectedLocationValue);
          localStorage.setItem('locationTimestamp', Date.now().toString());
          console.log('Location detected and set:', matchedLocation.label);
          toast.success('Location detected automatically', {
            description: `Showing products from ${matchedLocation.label}`,
          });
        }
      } else {
        console.log('Could not detect location automatically');
        toast.info('Location detection', {
          description: 'Could not detect your location. Please select manually.',
        });
      }
    } catch (error: any) {
      console.error('Auto-detect location failed:', error);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery);
    }
    if (selectedLocation && selectedLocation !== 'all') {
      const location = locations.find((loc: { value: string; label: string }) => loc.value === selectedLocation);
      if (location) {
        params.set('location', location.label);
      }
    }
    navigate(`/search?${params.toString()}`);
  };

  // Location search functions
  const handleLocationSearchInputChange = (value: string) => {
    setLocationSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (value.length < 2) {
      setLocationSearchResults([]);
      setShowLocationSearchResults(false);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchLocation(value);
    }, 500);
  };

  const handleSearchLocation = async (query: string) => {
    if (query.length < 2) return;

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BestOld-App/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLocationSearchResults(data);
        setShowLocationSearchResults(data.length > 0);
      }
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSelectLocationSearchResult = async (result: LocationSearchResult) => {
    const cityName = result.address.city || 
                     result.address.town || 
                     result.address.village || 
                     result.address.state || 
                     'Unknown';

    try {
      // Check if location already exists in our database
      const existingLocation = locations.find(loc => 
        loc.label.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(loc.label.toLowerCase())
      );

      if (existingLocation) {
        // Use existing location — apply coordinate radius if available
        setSelectedLocation(existingLocation.value);
        localStorage.setItem('userLocation', existingLocation.value);
        localStorage.setItem('locationTimestamp', Date.now().toString());

        // If the DB location has coordinates, prime gpsLocation immediately so
        // loadProductsByLocation (triggered via useEffect) uses radius filtering
        if (existingLocation.latitude && existingLocation.longitude) {
          setGpsLocation({ lat: existingLocation.latitude, lng: existingLocation.longitude, address: existingLocation.label });
        }

        // Clear search
        setLocationSearchQuery('');
        setLocationSearchResults([]);
        setShowLocationSearchResults(false);

        toast.success('Location selected', {
          description: `Showing products within 50km of ${existingLocation.label}`,
        });
      } else {
        // Location not in DB — use coordinates from Nominatim result (same as GPS mode)
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setGpsLocation({ lat, lng, address: cityName });
        setSelectedLocation('gps');

        localStorage.setItem('gpsLocation', JSON.stringify({ lat, lng, address: cityName }));
        localStorage.setItem('userLocation', 'gps');
        localStorage.setItem('locationTimestamp', Date.now().toString());

        // Clear search
        setLocationSearchQuery('');
        setLocationSearchResults([]);
        setShowLocationSearchResults(false);

        // Load products near these coordinates (50km radius)
        const { calculateDistance } = await import('@/utils/distance');
        const allProducts = await getFeaturedProducts(1000);

        const nearbyProducts = allProducts.filter(product => {
          if (!product.store?.latitude || !product.store?.longitude) return false;
          const storeLat = typeof product.store.latitude === 'string'
            ? parseFloat(product.store.latitude)
            : product.store.latitude;
          const storeLng = typeof product.store.longitude === 'string'
            ? parseFloat(product.store.longitude)
            : product.store.longitude;
          if (isNaN(storeLat) || isNaN(storeLng)) return false;
          return calculateDistance(lat, lng, storeLat, storeLng) <= 50;
        });

        // Sort nearest first
        nearbyProducts.sort((a, b) => {
          const latA = typeof a.store!.latitude === 'string' ? parseFloat(a.store!.latitude!) : a.store!.latitude!;
          const lngA = typeof a.store!.longitude === 'string' ? parseFloat(a.store!.longitude!) : a.store!.longitude!;
          const latB = typeof b.store!.latitude === 'string' ? parseFloat(b.store!.latitude!) : b.store!.latitude!;
          const lngB = typeof b.store!.longitude === 'string' ? parseFloat(b.store!.longitude!) : b.store!.longitude!;
          return calculateDistance(lat, lng, latA, lngA) - calculateDistance(lat, lng, latB, lngB);
        });

        setFeaturedProducts(nearbyProducts);

        toast.success(`📍 Location set to ${cityName}`, {
          description: nearbyProducts.length > 0
            ? `Found ${nearbyProducts.length} products within 50km`
            : 'No products nearby yet — showing all locations',
        });

        // Fall back to all products if none found nearby
        if (nearbyProducts.length === 0) {
          setSelectedLocation('all');
          localStorage.setItem('userLocation', 'all');
          const all = await getFeaturedProducts(1000);
          setFeaturedProducts(all);
        }
      }
    } catch (error) {
      console.error('Failed to select location:', error);
      toast.error('Failed to select location');
    }
  };

  // Click outside handler for location search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-search-container')) {
        setShowLocationSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Detecting your location...', {
      description: 'This may take a few seconds'
    });
    
    try {
      console.log('Starting GPS location detection...');
      
      // Try with high accuracy first, with longer timeout
      let position: GeolocationPosition | null = null;
      
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 30000, // Increased to 30 seconds
              maximumAge: 60000, // Accept cached position up to 1 minute old
            }
          );
        });
      } catch (highAccuracyError: any) {
        console.log('High accuracy failed, trying with lower accuracy...', highAccuracyError);
        
        // If high accuracy fails, try with lower accuracy (faster)
        if (highAccuracyError.code === 3) { // Timeout
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: false, // Lower accuracy, faster response
                timeout: 15000,
                maximumAge: 300000, // Accept cached position up to 5 minutes old
              }
            );
          });
        } else {
          throw highAccuracyError;
        }
      }

      if (!position) {
        throw new Error('Unable to get location');
      }

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      console.log('GPS coordinates obtained:', userLat, userLng, 'Accuracy:', accuracy, 'meters');

      // Get address using reverse geocoding (Nominatim - free, no API key needed)
      let detectedAddress = 'Current Location';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=14&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'BESTOLD-App'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          // Get the most specific location available
          const address = data.address;
          detectedAddress = address.village || address.town || address.city || 
                          address.county || address.state || 'Current Location';
          console.log('Reverse geocoded address:', detectedAddress, data);
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed, using generic name:', geocodeError);
      }

      // Store GPS location
      setGpsLocation({ lat: userLat, lng: userLng, address: detectedAddress });
      setSelectedLocation('gps'); // Special marker for GPS location
      
      // Store in localStorage
      localStorage.setItem('gpsLocation', JSON.stringify({ lat: userLat, lng: userLng, address: detectedAddress }));
      localStorage.setItem('userLocation', 'gps');
      localStorage.setItem('locationTimestamp', Date.now().toString());

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Filter products within 50km radius using coordinates
      const allProducts = await getFeaturedProducts(1000); // Get all products to filter
      
      // Import calculateDistance from distance utils
      const { calculateDistance } = await import('@/utils/distance');
      
      const nearbyProducts = allProducts.filter(product => {
        if (!product.store?.latitude || !product.store?.longitude) return false;
        
        const storeLat = typeof product.store.latitude === 'string' 
          ? parseFloat(product.store.latitude) 
          : product.store.latitude;
        const storeLng = typeof product.store.longitude === 'string' 
          ? parseFloat(product.store.longitude) 
          : product.store.longitude;
        
        if (isNaN(storeLat) || isNaN(storeLng)) return false;
        
        const distance = calculateDistance(userLat, userLng, storeLat, storeLng);
        return distance <= 50; // 50km radius
      });

      // Sort by distance (nearest first)
      const sortedProducts = nearbyProducts.sort((a, b) => {
        const latA = typeof a.store!.latitude === 'string' 
          ? parseFloat(a.store!.latitude!) 
          : a.store!.latitude!;
        const lngA = typeof a.store!.longitude === 'string' 
          ? parseFloat(a.store!.longitude!) 
          : a.store!.longitude!;
        const latB = typeof b.store!.latitude === 'string' 
          ? parseFloat(b.store!.latitude!) 
          : b.store!.latitude!;
        const lngB = typeof b.store!.longitude === 'string' 
          ? parseFloat(b.store!.longitude!) 
          : b.store!.longitude!;
        
        const distA = calculateDistance(userLat, userLng, latA, lngA);
        const distB = calculateDistance(userLat, userLng, latB, lngB);
        return distA - distB;
      });

      // Update products with all filtered results (no limit)
      setFeaturedProducts(sortedProducts);
      
      toast.success(`📍 Location: ${detectedAddress}`, {
        description: `Found ${nearbyProducts.length} products within 50km${accuracy > 1000 ? ' (approximate)' : ''}`
      });
      
    } catch (error: any) {
      console.error('Location detection error:', error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (error.code === 1) {
        toast.error('Location permission denied', {
          description: 'Please enable location permissions in your browser settings',
          duration: 5000,
        });
      } else if (error.code === 2) {
        toast.error('Location unavailable', {
          description: 'Unable to determine your location. Please check your GPS settings.',
          duration: 5000,
        });
      } else if (error.code === 3) {
        toast.error('Location detection timeout', {
          description: 'Please ensure GPS is enabled and try again, or select location manually.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to detect location', {
          description: 'Please select your location manually from the dropdown',
          duration: 5000,
        });
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  // Compute distance in km from the current gpsLocation to a product's store.
  // Returns undefined when no coordinates are available (so no badge is shown).
  const getProductDistance = (product: Product): number | undefined => {
    if (!gpsLocation) return undefined;
    const storeLat = product.store?.latitude;
    const storeLng = product.store?.longitude;
    if (storeLat == null || storeLng == null) return undefined;
    const lat = typeof storeLat === 'string' ? parseFloat(storeLat) : storeLat;
    const lng = typeof storeLng === 'string' ? parseFloat(storeLng) : storeLng;
    if (isNaN(lat) || isNaN(lng)) return undefined;
    return calculateDistance(gpsLocation.lat, gpsLocation.lng, lat, lng);
  };

  return (
    <div className="min-h-screen">
      <PageMeta 
        title="Home" 
        description="Buy and sell quality second-hand goods. Find great deals on electronics, furniture, clothing, and more from trusted sellers in your area."
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background pt-6 pb-20 md:py-20">
        <div className="container">
          {/* Franchise Button - Mobile Only (Top Left, aligned with logo) */}
          <div className="md:hidden mb-8">
            <Button
              asChild
              variant="default"
              size="default"
              className="h-10 px-5 text-sm font-semibold rounded-lg"
            >
              <Link to="/elite-partners" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Elite Partner
              </Link>
            </Button>
          </div>

          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Heading - VERY TOP */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Buy and Sell Second-Hand Goods
              </h1>
              <p className="text-xl text-muted-foreground mt-4">
                Discover great deals on quality pre-owned items from trusted sellers in your area
              </p>
            </div>

            {/* Form with Location and Search - SIDE BY SIDE */}
            <form onSubmit={handleSearch} className="max-w-6xl mx-auto mt-8">
              
              {/* Modern Search Bar Container - One Line */}
              <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4 p-6 bg-card rounded-2xl shadow-xl border border-border/50 backdrop-blur-sm">
                
                {/* LEFT: Location Search + GPS Button (40% - Smaller) */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location
                  </Label>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1 location-search-container">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                        <Input
                          type="text"
                          placeholder="Search city, town, or country..."
                          value={locationSearchQuery}
                          onChange={(e) => handleLocationSearchInputChange(e.target.value)}
                          className="h-12 pl-10 pr-10 bg-background/50 border-2 border-border hover:border-primary/50 focus:border-primary transition-all rounded-xl shadow-sm"
                        />
                        {searchingLocation && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
                        )}
                      </div>

                      {/* Search Results Dropdown */}
                      {showLocationSearchResults && locationSearchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                          {locationSearchResults.map((result) => {
                            const cityName = result.address.city || 
                                            result.address.town || 
                                            result.address.village || 
                                            result.address.state || 
                                            'Unknown';
                            return (
                              <button
                                key={result.place_id}
                                type="button"
                                onClick={() => handleSelectLocationSearchResult(result)}
                                className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-all flex items-start gap-3 border-b border-border/50 last:border-0 first:rounded-t-xl last:rounded-b-xl"
                              >
                                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground">{cityName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* GPS Detection Button */}
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="h-12 shrink-0 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      title="Detect nearest location using GPS"
                    >
                      {detectingLocation ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Navigation className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {/* Current Location Display */}
                  {selectedLocation && selectedLocation !== 'all' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">
                        {selectedLocation === 'gps' && gpsLocation 
                          ? gpsLocation.address 
                          : locations.find(loc => loc.value === selectedLocation)?.label || 'All Locations'}
                      </span>
                    </div>
                  )}
                  
                  {/* Location Detection Status */}
                  {detectingLocation && (
                    <div className="flex items-center gap-2 text-xs text-primary animate-pulse bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="font-medium">Detecting your location...</span>
                    </div>
                  )}
                </div>

                {/* RIGHT: Product Search + Search Button (60% - Bigger) */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Search Products
                  </Label>
                  
                  {/* Mobile: 80% input / 20% button, Desktop: flex-1 input / auto button */}
                  <div className="flex gap-2">
                    <div className="relative w-[80%] lg:flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search for products or stores..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-background/50 border-2 border-border hover:border-primary/50 focus:border-primary transition-all rounded-xl shadow-sm"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="h-12 w-[20%] lg:w-auto lg:px-8 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold p-0 lg:p-3"
                    >
                      <Search className="h-5 w-5 lg:mr-2" />
                      <span className="hidden lg:inline">Search</span>
                    </Button>
                  </div>
                </div>
                
              </div>
              
            </form>
            
            {/* Sell Phone Banner */}
            <div className="flex justify-center mt-8">
              <SellPhoneButton 
                trigger={
                  <div className="relative overflow-hidden rounded-xl cursor-pointer group bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg w-full max-w-md aspect-square">
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                      {/* Image */}
                      <div className="relative w-48 h-48">
                        <img
                          src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b446fa8a-a37d-4b04-9154-918d71072d36.jpg"
                          alt="Sell your phone"
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Text Content */}
                      <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-foreground">
                          Sell Your Phone
                        </h2>
                        <p className="text-base text-muted-foreground">
                          Get the best price for your device
                        </p>
                        <div className="flex items-center justify-center gap-2 text-primary font-semibold pt-2">
                          <span>Get Started</span>
                          <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="py-6 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse by Category</h2>
            <Link to="/categories" className="text-sm text-primary hover:underline">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-24 md:w-32 flex-shrink-0 bg-muted rounded-2xl" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="relative">
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/search?category=${category.id}`}
                    className="group flex-shrink-0 snap-start"
                  >
                    <div className="flex flex-col items-center w-24 md:w-32">
                      <div className="w-full aspect-square bg-muted rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid3x3 className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs md:text-sm font-medium text-center mt-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {category.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid3x3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No categories available yet</p>
            </div>
          )}
        </div>
      </section>
      {/* Store Banners Section */}
      <section className="py-6">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Stores</h2>
          </div>
          <BannerCarousel />
        </div>
      </section>
      {/* Featured Products */}
      <section className="py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold">Recently Listed</h2>
              {selectedLocation && selectedLocation !== 'all' && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Showing products from {selectedLocation === 'gps' && gpsLocation 
                    ? gpsLocation.address 
                    : locations.find(loc => loc.value === selectedLocation)?.label || 'your location'}
                  {featuredProducts.length > 0 && ` (${featuredProducts.length} items)`}
                  {selectedLocation === 'gps' && featuredProducts.length > 0 && (
                    <span className="text-xs">
                      • Within 50km radius
                    </span>
                  )}
                  {selectedLocation !== 'gps' && featuredProducts.length > 0 && (
                    <span className="text-xs">
                      • Including nearby areas within 300km
                    </span>
                  )}
                </p>
              )}
              {selectedLocation === 'all' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing all products from all locations
                  {featuredProducts.length > 0 && ` (${featuredProducts.length} items)`}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full bg-muted" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  layout={window.innerWidth < 768 ? 'list' : 'grid'}
                  distanceKm={getProductDistance(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              {selectedLocation && selectedLocation !== 'all' ? (
                <>
                  <p className="text-lg font-semibold mb-2">No products found in this location</p>
                  <p className="text-muted-foreground mb-4">
                    Try selecting a different location or view all products
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedLocation('all');
                      localStorage.setItem('userLocation', 'all');
                      localStorage.setItem('locationTimestamp', Date.now().toString());
                    }}
                  >
                    View All Locations
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold mb-2">No products available yet</p>
                  <p className="text-muted-foreground mb-4">
                    Be the first to list your items for sale
                  </p>
                  <Button asChild>
                    <Link to="/sell">Start Selling</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
