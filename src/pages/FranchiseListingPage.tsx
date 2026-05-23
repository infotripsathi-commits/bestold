import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Store as StoreIcon, Award } from 'lucide-react';
import { getFranchiseStores } from '@/db/api';
import FranchiseBadge from '@/components/FranchiseBadge';
import { toast } from 'sonner';
import type { Store } from '@/types';

export default function FranchiseListingPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    loadFranchiseStores();
  }, []);

  const loadFranchiseStores = async () => {
    try {
      setLoading(true);
      const data = await getFranchiseStores();
      setStores(data);
    } catch (error) {
      console.error('Failed to load franchise stores:', error);
      toast.error('Failed to load franchise stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const data = await getFranchiseStores({
        query: searchQuery,
        location: locationFilter
      });
      setStores(data);
    } catch (error) {
      console.error('Failed to search franchise stores:', error);
      toast.error('Failed to search stores');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || 
      store.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Award className="h-16 w-16" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Authorized Elite Partners</h1>
            <p className="text-lg md:text-xl text-primary-foreground/90">
              Shop with confidence from our verified elite partner stores offering online purchasing and delivery
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search elite partner stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <StoreIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{stores.length}</div>
              <div className="text-sm text-muted-foreground">Total Elite Partners</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Verified Sellers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{new Set(stores.map(s => s.location)).size}</div>
              <div className="text-sm text-muted-foreground">Locations</div>
            </CardContent>
          </Card>
        </div>

        {/* Franchise Stores Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading elite partner stores...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <StoreIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No elite partner stores found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <Card key={store.id} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-1">{store.name}</CardTitle>
                    <FranchiseBadge variant="compact" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{store.location}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {store.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div>
                      <div className="font-semibold">{store.average_rating?.toFixed(1) || 'N/A'}</div>
                      <div className="text-muted-foreground">Rating</div>
                    </div>
                    <div>
                      <div className="font-semibold">{store.total_reviews || 0}</div>
                      <div className="text-muted-foreground">Reviews</div>
                    </div>
                    <div>
                      <div className="font-semibold">{store.location}</div>
                      <div className="text-muted-foreground">Location</div>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/stores/${store.id}`}>
                      <StoreIcon className="h-4 w-4 mr-2" />
                      View Store
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
