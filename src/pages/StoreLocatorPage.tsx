import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Search,
  Navigation,
  Store,
  Phone,
  Mail,
  Star,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Link } from 'react-router-dom';
import SEO from '@/components/common/SEO';
import { createServiceAreaSchema } from '@/lib/localSEO';

interface StoreLocation {
  id: string;
  name: string;
  description: string;
  location: string;
  contact_info?: string;
  average_rating: number;
  total_reviews: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export default function StoreLocatorPage() {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    getUserLocation();
    loadStores();
  }, []);

  useEffect(() => {
    filterStores();
  }, [searchQuery, stores, userLocation]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Showing all stores.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'approved')
        .order('average_rating', { ascending: false });

      if (error) throw error;

      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterStores = () => {
    let filtered = [...stores];

    // Calculate distances if user location is available
    if (userLocation) {
      filtered = filtered.map((store) => ({
        ...store,
        distance:
          store.latitude && store.longitude
            ? calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
            : undefined,
      }));

      // Sort by distance
      filtered.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (store) =>
          store.name.toLowerCase().includes(query) ||
          store.location.toLowerCase().includes(query) ||
          store.description?.toLowerCase().includes(query)
      );
    }

    setFilteredStores(filtered);
  };

  const openInMaps = (store: StoreLocation) => {
    if (store.latitude && store.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        store.name + ' ' + store.location
      )}`;
      window.open(url, '_blank');
    }
  };

  const serviceAreas = [...new Set(stores.map((s) => s.location))];
  const structuredData = createServiceAreaSchema({
    name: 'BESTOLD',
    url: window.location.origin,
    serviceAreas,
  });

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Store Locator - Find Second Hand Stores Near You | BESTOLD"
        description={`Find quality second-hand goods stores near you. Browse ${stores.length} local stores across multiple cities. Buy and sell used items in your area.`}
        keywords="store locator, second hand stores near me, used goods stores, thrift stores near me, local resale shops"
        structuredData={structuredData}
      />

      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Find Stores Near You</h1>
          <p className="text-lg text-muted-foreground">
            Discover {stores.length} quality second-hand goods stores in your area
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by store name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={getUserLocation} variant="outline">
                <Navigation className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
            </div>

            {locationError && (
              <Alert className="mt-4">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}

            {userLocation && (
              <p className="text-sm text-muted-foreground mt-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                Showing stores sorted by distance from your location
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'} found
          </p>
        </div>

        {/* Store List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStores.map((store) => (
            <Card key={store.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{store.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{store.location}</span>
                    </CardDescription>
                  </div>
                  {store.distance !== undefined && (
                    <Badge variant="secondary" className="shrink-0">
                      {store.distance.toFixed(1)} km
                    </Badge>
                  )}
                </div>

                {store.average_rating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{store.average_rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({store.total_reviews} reviews)
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-3">
                {store.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>
                )}

                {store.contact_info && (
                  <div className="space-y-1">
                    {store.contact_info.includes('@') ? (
                      <a
                        href={`mailto:${store.contact_info}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {store.contact_info}
                      </a>
                    ) : (
                      <a
                        href={`tel:${store.contact_info}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {store.contact_info}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-3">
                  <Button asChild className="flex-1" size="sm">
                    <Link to={`/store/${store.id}`}>
                      <Store className="h-3 w-3 mr-1" />
                      View Store
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInMaps(store)}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stores found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or check back later for new stores.
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
