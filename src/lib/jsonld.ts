// JSON-LD Structured Data helpers for BestOld
// All schemas validated against https://schema.org
// Inject via <StructuredData schema={...} /> (see PageMeta.tsx)

const BASE_URL = 'https://bestold.in';

// ---------------------------------------------------------------------------
// Organization (site-wide)
// ---------------------------------------------------------------------------

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'BestOld',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/icons/icon-512x512.png`,
    },
    description:
      'BestOld is India\'s trusted second-hand goods marketplace for buying and selling quality used products from verified local stores.',
    sameAs: [
      // Add social profile URLs here when available
    ],
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    foundingLocation: {
      '@type': 'Place',
      addressCountry: 'IN',
    },
  };
}

// ---------------------------------------------------------------------------
// WebSite (enables Google Sitelinks search box)
// ---------------------------------------------------------------------------

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'BestOld',
    description: 'Buy & Sell Second-Hand Goods in India',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Product (for /products/:id)
// ---------------------------------------------------------------------------

export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';

const SCHEMA_CONDITION_MAP: Record<ProductCondition, string> = {
  new: 'https://schema.org/NewCondition',
  like_new: 'https://schema.org/LikeNewCondition',
  good: 'https://schema.org/UsedCondition',
  fair: 'https://schema.org/DamagedCondition',
};

export interface ProductSchemaInput {
  id: string;
  title: string;
  description?: string;
  price: number;
  condition: ProductCondition;
  status: string;
  images: string[];
  category?: { name: string } | null;
  store?: {
    id: string;
    name: string;
    location: string;
    average_rating: number;
    total_reviews: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export function buildProductSchema(product: ProductSchemaInput) {
  const productUrl = `${BASE_URL}/products/${product.id}`;
  const availability =
    product.status === 'active'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: product.title,
    description:
      product.description ||
      `${product.title} — quality second-hand item available on BestOld.`,
    url: productUrl,
    image: product.images?.length ? product.images : undefined,
    itemCondition: SCHEMA_CONDITION_MAP[product.condition] ?? 'https://schema.org/UsedCondition',
    category: product.category?.name,
    datePublished: product.created_at,
    dateModified: product.updated_at,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price,
      availability,
      itemCondition:
        SCHEMA_CONDITION_MAP[product.condition] ?? 'https://schema.org/UsedCondition',
      seller: product.store
        ? {
            '@type': 'Organization',
            name: product.store.name,
            url: `${BASE_URL}/stores/${product.store.id}`,
          }
        : undefined,
    },
  };

  // Add aggregate rating only when data is meaningful
  if (product.store && product.store.total_reviews > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: product.store.average_rating.toFixed(1),
      reviewCount: product.store.total_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

// ---------------------------------------------------------------------------
// LocalBusiness — used for store detail pages (/stores/:id)
// ---------------------------------------------------------------------------

export interface StoreSchemaInput {
  id: string;
  name: string;
  description?: string;
  location: string;
  contact_phone?: string;
  phone_number?: string;
  banner_image_url?: string;
  latitude?: number;
  longitude?: number;
  average_rating: number;
  total_reviews: number;
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
}

export function buildLocalBusinessSchema(store: StoreSchemaInput) {
  const storeUrl = `${BASE_URL}/stores/${store.id}`;
  const phone = store.phone_number || store.contact_phone;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': storeUrl,
    name: store.name,
    description:
      store.description ||
      `Quality second-hand goods store in ${store.location} — browse and buy on BestOld.`,
    url: storeUrl,
    image: store.banner_image_url || undefined,
    telephone: phone || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: store.location,
      addressCountry: 'IN',
    },
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI',
    priceRange: '₹',
    datePublished: store.created_at,
    dateModified: store.updated_at,
  };

  if (store.latitude && store.longitude) {
    schema['geo'] = {
      '@type': 'GeoCoordinates',
      latitude: store.latitude,
      longitude: store.longitude,
    };
  }

  if (store.total_reviews > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: store.average_rating.toFixed(1),
      reviewCount: store.total_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const sameAs: string[] = [];
  if (store.facebook_url) sameAs.push(store.facebook_url);
  if (store.instagram_url) sameAs.push(store.instagram_url);
  if (store.youtube_url) sameAs.push(store.youtube_url);
  if (sameAs.length) schema['sameAs'] = sameAs;

  return schema;
}
