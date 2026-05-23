import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Star, Store as StoreIcon, Search } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { fetchLocations } from '@/lib/locations';
import { getPromotedStores } from '@/db/api';
import BusinessTypeBadge from '@/components/BusinessTypeBadge';
import type { Store } from '@/types';

export default function AllStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [promotedStores, setPromotedStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [filteredPromoted, setFilteredPromoted] = useState<Store[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    loadStores();
    loadPromotedStores();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const locs = await fetchLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadPromotedStores = async () => {
    try {
      const promoted = await getPromotedStores();
      setPromotedStores(promoted);
      setFilteredPromoted(promoted);
    } catch (error) {
      console.error('Failed to load promoted stores:', error);
    }
  };

  useEffect(() => {
    filterStores();
  }, [searchQuery, selectedLocation, stores, promotedStores]);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          seller:profiles!stores_seller_id_fkey(*)
        `)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(Array.isArray(data) ? data : []);
      setFilteredStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStores = () => {
    setFiltering(true);
    let filtered = [...stores];
    let filteredProm = [...promotedStores];

    // Filter by search query (store name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((store) =>
        store.name.toLowerCase().includes(query)
      );
      filteredProm = filteredProm.filter((store) =>
        store.name.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (selectedLocation && selectedLocation !== 'all') {
      filtered = filtered.filter((store) => store.location === selectedLocation);
      filteredProm = filteredProm.filter((store) => store.location === selectedLocation);
    }

    setFilteredStores(filtered);
    setFilteredPromoted(filteredProm);
    
    // Small delay to show filtering feedback
    setTimeout(() => setFiltering(false), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8">All Stores</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container">
        <h1 className="text-3xl font-bold mb-8">All Stores</h1>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stores by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {filtering && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.value} value={location.label}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredPromoted.length + filteredStores.length} {(filteredPromoted.length + filteredStores.length) === 1 ? 'store' : 'stores'} found
        </p>

        {/* Stores Grid */}
        {filteredPromoted.length === 0 && filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <StoreIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground mb-2">No stores found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Promoted Stores First */}
            {filteredPromoted.map((store) => (
              <Link key={store.id} to={`/stores/${store.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full border-2 border-primary/30 bg-primary/5">
                  {store.banner_image_url && (
                    <div className="aspect-video relative">
                      <img
                        src={store.banner_image_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                        ⭐ Promoted
                      </Badge>
                    </div>
                  )}
                  {!store.banner_image_url && (
                    <div className="p-4">
                      <Badge className="bg-primary text-primary-foreground">
                        ⭐ Promoted
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{store.name}</h3>
                      <Badge variant="secondary" className="ml-2">
                        <Star className="h-3 w-3 fill-primary text-primary mr-1" />
                        {store.average_rating?.toFixed(1) || 'N/A'}
                      </Badge>
                    </div>
                    
                    {store.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {store.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{store.location}</span>
                    </div>

                    {/* Business Type Badge */}
                    {store.business_type && (
                      <div className="mt-3">
                        <BusinessTypeBadge businessType={store.business_type} size="sm" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{store.total_reviews || 0} reviews</span>
                      {store.seller?.full_name && (
                        <span>by {store.seller.full_name}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {/* Regular Stores */}
            {filteredStores.map((store) => (
              <Link key={store.id} to={`/stores/${store.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {store.banner_image_url && (
                    <div className="aspect-video relative">
                      <img
                        src={store.banner_image_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{store.name}</h3>
                      <Badge variant="secondary" className="ml-2">
                        <Star className="h-3 w-3 fill-primary text-primary mr-1" />
                        {store.average_rating.toFixed(1)}
                      </Badge>
                    </div>
                    
                    {store.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {store.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{store.location}</span>
                    </div>

                    {/* Business Type Badge */}
                    {store.business_type && (
                      <div className="mt-3">
                        <BusinessTypeBadge businessType={store.business_type} size="sm" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{store.total_reviews} reviews</span>
                      {store.seller?.full_name && (
                        <span>by {store.seller.full_name}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
