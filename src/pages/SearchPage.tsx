import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, Package2, Store as StoreIcon, Star, Navigation, X, Smartphone } from 'lucide-react';
import { searchProducts, searchStores, getCategoriesWithSubcategories, logFilterUsage, getPhoneBrands } from '@/db/api';
import { fetchLocations, detectUserLocation } from '@/lib/locations';
import ProductCard from '@/components/ProductCard';
import MultiSelectCategoryFilter from '@/components/MultiSelectCategoryFilter';
import FilterSuggestions from '@/components/FilterSuggestions';
import type { Product, Store, CategoryWithSubcategories, PhoneBrand } from '@/types';
import { toast } from 'sonner';

const STORAGE_OPTIONS = ['8 GB', '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];
const RAM_OPTIONS = ['1 GB', '2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'];

function isMobileCategory(name?: string) {
  if (!name) return false;
  const n = name.toLowerCase();
  return n.includes('mobile') || n.includes('phone') || n.includes('smartphone');
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || 'all');
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  const [phoneFilterBrand, setPhoneFilterBrand] = useState('all');
  const [phoneFilterStorage, setPhoneFilterStorage] = useState('all');
  const [phoneFilterRam, setPhoneFilterRam] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derived: is a mobile category selected?
  const mobileActive = useMemo(
    () => selectedCategories.some(id => isMobileCategory(categories.find(c => c.id === id)?.name)),
    [selectedCategories, categories],
  );

  useEffect(() => {
    loadCategories();
    loadLocations();
    getPhoneBrands().then(d => setPhoneBrands(d as PhoneBrand[])).catch(() => {});
  }, []);

  const loadLocations = async () => {
    try {
      const locs = await fetchLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  useEffect(() => {
    // Scroll to top when search params change
    window.scrollTo(0, 0);
    
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    
    if (query) {
      setSearchQuery(query);
    }
    if (location) {
      setSelectedLocation(location);
    }
    
    // Always perform search, even with no parameters (to show all products)
    performSearch(query || '', location || '');
  }, [searchParams]);

  // Trigger search when category/subcategory selections change
  useEffect(() => {
    if (searchQuery || selectedCategories.length > 0 || selectedSubcategories.length > 0) {
      performSearch(searchQuery, selectedLocation !== 'all' ? selectedLocation : undefined);
      
      // Log filter usage for suggestions
      if (selectedCategories.length > 0 || selectedSubcategories.length > 0) {
        logFilterUsage(
          selectedCategories,
          selectedSubcategories,
          searchQuery,
          selectedLocation !== 'all' ? selectedLocation : undefined
        );
      }
    }
  }, [selectedCategories, selectedSubcategories]);

  const loadCategories = async () => {
    try {
      const cats = await getCategoriesWithSubcategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const performSearch = async (query: string, location?: string) => {
    setLoading(true);
    try {
      const filters = {
        query,
        category_ids: selectedCategories.length > 0 ? selectedCategories : undefined,
        subcategory_ids: selectedSubcategories.length > 0 ? selectedSubcategories : undefined,
        location: location,
      };

      const [productsData, storesData] = await Promise.all([
        searchProducts(filters),
        searchStores(filters),
      ]);

      setProducts(productsData);
      setStores(storesData);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery);
    }
    if (selectedLocation && selectedLocation !== 'all') {
      params.set('location', selectedLocation);
    }
    setSearchParams(params);
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const location = await detectUserLocation();
      if (location) {
        setSelectedLocation(location);
        performSearch(searchQuery, location);
        toast.success('Location detected successfully');
      } else {
        toast.info('Unable to detect location. Please select manually.');
      }
    } catch (error) {
      toast.error('Failed to detect location');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSuggestionClick = (filterId: string, filterType: 'category' | 'subcategory') => {
    if (filterType === 'category') {
      if (!selectedCategories.includes(filterId)) {
        setSelectedCategories([...selectedCategories, filterId]);
      }
    } else {
      if (!selectedSubcategories.includes(filterId)) {
        setSelectedSubcategories([...selectedSubcategories, filterId]);
      }
    }
  };

  // Client-side phone spec filtering — applied on top of server results
  const filteredProducts = useMemo(() => {
    if (!mobileActive || (phoneFilterBrand === 'all' && phoneFilterStorage === 'all' && phoneFilterRam === 'all')) {
      return products;
    }
    return products.filter((p) => {
      const pd = (p as Product & { phone_details?: { brand?: string; storage?: string; ram?: string } | null }).phone_details;
      if (!pd) return false;
      if (phoneFilterBrand !== 'all' && pd.brand !== phoneFilterBrand) return false;
      if (phoneFilterStorage !== 'all' && pd.storage !== phoneFilterStorage) return false;
      if (phoneFilterRam !== 'all' && pd.ram !== phoneFilterRam) return false;
      return true;
    });
  }, [products, mobileActive, phoneFilterBrand, phoneFilterStorage, phoneFilterRam]);

  const clearPhoneFilters = () => {
    setPhoneFilterBrand('all');
    setPhoneFilterStorage('all');
    setPhoneFilterRam('all');
  };

  return (
    <div className="min-h-screen py-6">
      <div className="container">
        {/* Filter Suggestions */}
        <div className="mb-6">
          <FilterSuggestions
            selectedCategories={selectedCategories}
            selectedSubcategories={selectedSubcategories}
            userId={user?.id}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedLocation !== 'all' || selectedCategories.length > 0 || selectedSubcategories.length > 0 || phoneFilterBrand !== 'all' || phoneFilterStorage !== 'all' || phoneFilterRam !== 'all') && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
              </Badge>
            )}
            {selectedLocation !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {locations.find(l => l.label === selectedLocation)?.label || selectedLocation}
              </Badge>
            )}
            {selectedCategories.map((catId) => {
              const category = categories.find(c => c.id === catId);
              return category ? (
                <Badge key={catId} variant="secondary" className="gap-1">
                  {category.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== catId))}
                  />
                </Badge>
              ) : null;
            })}
            {selectedSubcategories.map((subId) => {
              const subcategory = categories
                .flatMap(c => c.subcategories || [])
                .find(s => s.id === subId);
              return subcategory ? (
                <Badge key={subId} variant="secondary" className="gap-1">
                  {subcategory.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setSelectedSubcategories(selectedSubcategories.filter(id => id !== subId))}
                  />
                </Badge>
              ) : null;
            })}
            {phoneFilterBrand !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                <Smartphone className="h-3 w-3" />
                {phoneFilterBrand}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setPhoneFilterBrand('all')} />
              </Badge>
            )}
            {phoneFilterStorage !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Storage: {phoneFilterStorage}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setPhoneFilterStorage('all')} />
              </Badge>
            )}
            {phoneFilterRam !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                RAM: {phoneFilterRam}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setPhoneFilterRam('all')} />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('all');
                setSelectedCategories([]);
                setSelectedSubcategories([]);
                clearPhoneFilters();
                setSearchParams(new URLSearchParams());
              }}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Filters Bar - OLX Style */}
        <div className="mb-6 flex flex-col gap-3 bg-muted/30 p-4 rounded-lg relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading results...</span>
              </div>
            </div>
          )}

          {/* Row 1: category + location */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium">Filters:</span>
            <MultiSelectCategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              selectedSubcategories={selectedSubcategories}
              onSelectionChange={(cats, subs) => {
                setSelectedCategories(cats);
                setSelectedSubcategories(subs);
              }}
            />
            <div className="flex gap-2">
              <Select value={selectedLocation} onValueChange={(value) => {
                setSelectedLocation(value);
                performSearch(searchQuery, value !== 'all' ? value : undefined);
              }}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Location" />
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                title="Detect my location"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: phone-specific filters — only when a mobile category is selected */}
          {mobileActive && (
            <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Smartphone className="h-4 w-4" />
                <span>Mobile filters:</span>
              </div>

              {/* Brand */}
              <Select value={phoneFilterBrand} onValueChange={setPhoneFilterBrand}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {phoneBrands.map((b) => (
                    <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Storage */}
              <Select value={phoneFilterStorage} onValueChange={setPhoneFilterStorage}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Storage</SelectItem>
                  {STORAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* RAM */}
              <Select value={phoneFilterRam} onValueChange={setPhoneFilterRam}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="RAM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RAM</SelectItem>
                  {RAM_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(phoneFilterBrand !== 'all' || phoneFilterStorage !== 'all' || phoneFilterRam !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearPhoneFilters} className="h-8 text-xs">
                  Clear mobile filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({filteredProducts.length + stores.length})
            </TabsTrigger>
            <TabsTrigger value="products">
              Products ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="stores">
              Stores ({stores.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full bg-muted" />
                <Skeleton className="h-32 w-full bg-muted" />
              </div>
            ) : (
              <div className="space-y-8">
                {stores.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Stores</h2>
                    <div className="grid gap-4">
                      {stores.map((store) => (
                        <Link key={store.id} to={`/stores/${store.id}`}>
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <StoreIcon className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">{store.name}</h3>
                                  </div>
                                  <p className="text-muted-foreground mb-2 line-clamp-2">
                                    {store.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{store.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 fill-primary text-primary" />
                                      <span>{store.average_rating.toFixed(1)}</span>
                                      <span className="text-muted-foreground">
                                        ({store.total_reviews} reviews)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Products</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map((product) => (
                        <Link key={product.id} to={`/products/${product.id}`}>
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <div className="aspect-square overflow-hidden bg-muted">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package2 className="h-16 w-16 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold line-clamp-1 mb-2">{product.title}</h3>
                              <p className="text-2xl font-bold text-primary mb-2">
                                ₹{product.price.toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="line-clamp-1">{product.store?.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="line-clamp-1">{product.store?.location}</span>
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                              <Badge variant="secondary" className="capitalize">
                                {product.condition?.replace('_', ' ')}
                              </Badge>
                            </CardFooter>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {!loading && filteredProducts.length === 0 && stores.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold mb-2">No results found</p>
                    <p className="text-muted-foreground">
                      {selectedLocation !== 'all' 
                        ? `No products or stores found in ${locations.find(l => l.label === selectedLocation)?.label || selectedLocation}`
                        : 'Try adjusting your search or filters'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 bg-muted" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    layout={window.innerWidth < 768 ? 'list' : 'grid'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">No products found</p>
                <p className="text-muted-foreground">
                  {selectedLocation !== 'all' 
                    ? `No products available in ${locations.find(l => l.label === selectedLocation)?.label || selectedLocation}`
                    : 'Try adjusting your filters'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-muted" />
                ))}
              </div>
            ) : stores.length > 0 ? (
              <div className="grid gap-4">
                {stores.map((store) => (
                  <Link key={store.id} to={`/stores/${store.id}`}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <StoreIcon className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-semibold">{store.name}</h3>
                            </div>
                            <p className="text-muted-foreground mb-2 line-clamp-2">
                              {store.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{store.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span>{store.average_rating.toFixed(1)}</span>
                                <span className="text-muted-foreground">
                                  ({store.total_reviews} reviews)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <StoreIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">No stores found</p>
                <p className="text-muted-foreground">
                  {selectedLocation !== 'all' 
                    ? `No stores available in ${locations.find(l => l.label === selectedLocation)?.label || selectedLocation}`
                    : 'Try adjusting your filters'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
