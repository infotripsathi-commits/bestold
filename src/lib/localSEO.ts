// Local SEO Schema Markup Generator

export interface LocalBusinessData {
  name: string;
  description: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  email?: string;
  url: string;
  image?: string;
  priceRange?: string;
  openingHours?: string[];
  rating?: {
    ratingValue: number;
    reviewCount: number;
  };
  paymentAccepted?: string[];
  currenciesAccepted?: string;
}

export function createLocalBusinessSchema(business: LocalBusinessData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    image: business.image,
    '@id': business.url,
    url: business.url,
    telephone: business.telephone,
    email: business.email,
    priceRange: business.priceRange || '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.streetAddress,
      addressLocality: business.address.addressLocality,
      addressRegion: business.address.addressRegion,
      postalCode: business.address.postalCode,
      addressCountry: business.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
    },
    openingHoursSpecification: business.openingHours?.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(':')[0],
      opens: hours.split(':')[1]?.split('-')[0],
      closes: hours.split(':')[1]?.split('-')[1],
    })),
    aggregateRating: business.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: business.rating.ratingValue,
          reviewCount: business.rating.reviewCount,
        }
      : undefined,
    paymentAccepted: business.paymentAccepted?.join(', '),
    currenciesAccepted: business.currenciesAccepted || 'INR',
  };
}

export function createStoreWithLocationSchema(store: {
  id: string;
  name: string;
  description: string;
  location: string;
  contact_info?: string;
  average_rating?: number;
  total_reviews?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
}) {
  const baseUrl = window.location.origin;

  return createLocalBusinessSchema({
    name: store.name,
    description: store.description || `Quality second-hand goods store in ${store.location}`,
    address: {
      streetAddress: store.address || '',
      addressLocality: store.city || store.location,
      addressRegion: store.state || '',
      postalCode: store.zip || '',
      addressCountry: 'IN',
    },
    geo: {
      latitude: store.latitude || 0,
      longitude: store.longitude || 0,
    },
    telephone: store.phone || store.contact_info,
    email: store.email,
    url: `${baseUrl}/stores/${store.id}`,
    priceRange: '₹',
    rating: store.average_rating
      ? {
          ratingValue: store.average_rating,
          reviewCount: store.total_reviews || 0,
        }
      : undefined,
    paymentAccepted: ['Cash', 'UPI', 'Debit Card'],
    currenciesAccepted: 'INR',
  });
}

export function createCityPageSchema(city: string, state: string, storeCount: number) {
  const baseUrl = window.location.origin;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Second Hand Goods in ${city}, ${state}`,
    description: `Find quality used items and pre-owned products in ${city}, ${state}. Browse ${storeCount} local stores selling second-hand goods.`,
    url: `${baseUrl}/location/${city.toLowerCase().replace(/\s+/g, '-')}`,
    about: {
      '@type': 'Thing',
      name: 'Second Hand Goods',
      description: 'Pre-owned and used items marketplace',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: storeCount,
      itemListElement: `Stores in ${city}, ${state}`,
    },
  };
}

export function createServiceAreaSchema(business: {
  name: string;
  url: string;
  serviceAreas: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: business.name,
    url: business.url,
    areaServed: business.serviceAreas.map((area) => ({
      '@type': 'City',
      name: area,
    })),
  };
}

// Generate location-specific keywords
export function generateLocalKeywords(city: string, state: string, category?: string): string[] {
  const baseKeywords = [
    `second hand goods ${city}`,
    `used items ${city}`,
    `thrift store ${city}`,
    `pre-owned products ${city}`,
    `second hand store ${city} ${state}`,
    `buy used items ${city}`,
    `sell second hand ${city}`,
    `resale shop ${city}`,
    `vintage store ${city}`,
    `consignment shop ${city}`,
  ];

  if (category) {
    baseKeywords.push(
      `used ${category} ${city}`,
      `second hand ${category} ${city}`,
      `pre-owned ${category} ${city}`,
      `${category} resale ${city}`
    );
  }

  return baseKeywords;
}

// Generate location-specific meta description
export function generateLocalMetaDescription(
  city: string,
  state: string,
  storeCount: number,
  category?: string
): string {
  const categoryText = category ? `${category} and other ` : '';
  return `Shop ${categoryText}second-hand goods in ${city}, ${state}. Browse ${storeCount} local stores with quality used items. Buy and sell pre-owned products near you. Free local pickup available.`;
}

// Generate location-specific title
export function generateLocalTitle(city: string, state: string, category?: string): string {
  const categoryText = category ? `${category} - ` : '';
  return `${categoryText}Second Hand Goods in ${city}, ${state} | BESTOLD`;
}
