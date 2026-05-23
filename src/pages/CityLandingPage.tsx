import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Store,
  Package,
  TrendingUp,
  Star,
  Phone,
  Mail,
  Navigation,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import SEO from '@/components/common/SEO';
import {
  generateLocalKeywords,
  generateLocalMetaDescription,
  generateLocalTitle,
  createCityPageSchema,
} from '@/lib/localSEO';

interface CityStore {
  id: string;
  name: string;
  description: string;
  location: string;
  average_rating: number;
  total_reviews: number;
  contact_info?: string;
}

interface CityProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  store_id: string;
  store_name: string;
}

export default function CityLandingPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [stores, setStores] = useState<CityStore[]>([]);
  const [products, setProducts] = useState<CityProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse city and state from slug (e.g., "new-york-ny" -> "New York", "NY")
  const parseCitySlug = (slug: string) => {
    const parts = slug.split('-');
    const state = parts[parts.length - 1].toUpperCase();
    const city = parts
      .slice(0, -1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { city, state };
  };

  const { city, state } = parseCitySlug(citySlug || '');

  useEffect(() => {
    loadCityData();
  }, [citySlug]);

  const loadCityData = async () => {
    try {
      // Load stores in this city
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'approved')
        .ilike('location', `%${city}%`)
        .order('average_rating', { ascending: false })
        .limit(12);

      if (storesError) throw storesError;
      setStores(storesData || []);

      // Load products from stores in this city
      if (storesData && storesData.length > 0) {
        const storeIds = storesData.map((s: any) => s.id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(
            `
            id,
            title,
            price,
            images,
            condition,
            store_id,
            stores!inner(name)
          `
          )
          .in('store_id', storeIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(12);

        if (productsError) throw productsError;

        const formattedProducts = (productsData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          images: p.images,
          condition: p.condition,
          store_id: p.store_id,
          store_name: p.stores?.name || '',
        }));

        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error loading city data:', error);
    } finally {
      setLoading(false);
    }
  };

  const keywords = generateLocalKeywords(city, state);
  const description = generateLocalMetaDescription(city, state, stores.length);
  const title = generateLocalTitle(city, state);
  const structuredData = createCityPageSchema(city, state, stores.length);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <SEO
          title={title}
          description={`Find second-hand goods in ${city}, ${state}. Browse quality used items and pre-owned products from local sellers.`}
          keywords={keywords.join(', ')}
        />

        <div className="container py-8">
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              No stores found in {city}, {state} yet. Check back soon or explore stores in other
              cities.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button asChild>
              <Link to="/stores">Browse All Stores</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords.join(', ')}
        structuredData={structuredData}
      />

      <div className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span>
              {city}, {state}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold">
            Second Hand Goods in {city}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover quality used items and pre-owned products from {stores.length} local stores in{' '}
            {city}, {state}. Buy and sell second-hand goods near you.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Local Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores.length}</div>
              <p className="text-xs text-muted-foreground">Verified sellers in {city}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}+</div>
              <p className="text-xs text-muted-foreground">Quality used products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stores.length > 0
                  ? (
                      stores.reduce((sum, s) => sum + s.average_rating, 0) / stores.length
                    ).toFixed(1)
                  : '0.0'}
              </div>
              <p className="text-xs text-muted-foreground">Customer satisfaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Stores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Top Stores in {city}</h2>
            <Button asChild variant="outline">
              <Link to="/stores">View All</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.slice(0, 6).map((store) => (
              <Card key={store.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {store.location}
                  </CardDescription>

                  {store.average_rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{store.average_rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({store.total_reviews})
                      </span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-3">
                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {store.description}
                    </p>
                  )}

                  {store.contact_info && (
                    <div className="text-sm">
                      {store.contact_info.includes('@') ? (
                        <a
                          href={`mailto:${store.contact_info}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          Contact
                        </a>
                      ) : (
                        <a
                          href={`tel:${store.contact_info}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {store.contact_info}
                        </a>
                      )}
                    </div>
                  )}

                  <Button asChild className="mt-auto" size="sm">
                    <Link to={`/store/${store.id}`}>View Store</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        {products.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Latest Items in {city}</h2>
              <Button asChild variant="outline">
                <Link to="/products">View All</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <Card key={product.id} className="h-full flex flex-col">
                  <CardHeader className="p-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-2 p-4">
                    <h3 className="font-semibold line-clamp-2">{product.title}</h3>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <Badge variant="secondary">{product.condition}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">{product.store_name}</p>

                    <Button asChild size="sm" className="mt-auto">
                      <Link to={`/product/${product.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Local SEO Content */}
        <Card>
          <CardHeader>
            <CardTitle>Why Buy Second Hand in {city}?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Shopping for second-hand goods in {city}, {state} is a smart choice for both your
              wallet and the environment. Our platform connects you with {stores.length} verified
              local sellers offering quality pre-owned items at great prices.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Benefits of Shopping Local</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Support local {city} businesses</li>
                  <li>Inspect items before buying</li>
                  <li>Save on shipping costs</li>
                  <li>Meet sellers face-to-face</li>
                  <li>Reduce environmental impact</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Popular Categories in {city}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Electronics & Gadgets</li>
                  <li>Furniture & Home Decor</li>
                  <li>Clothing & Accessories</li>
                  <li>Books & Media</li>
                  <li>Sports & Outdoors</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button asChild>
                <Link to="/stores">
                  <Store className="h-4 w-4 mr-2" />
                  Browse All Stores
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/store-locator">
                  <Navigation className="h-4 w-4 mr-2" />
                  Find Stores Near Me
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
