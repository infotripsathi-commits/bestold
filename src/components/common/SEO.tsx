// SEO Component for dynamic meta tags
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  canonical?: string;
  structuredData?: object;
}

export default function SEO({
  title = 'BESTOLD - Buy & Sell Second-Hand Goods | Multi-Vendor Marketplace',
  description = 'BESTOLD is the best platform to buy and sell second-hand goods. Create your store, chat with sellers, and find amazing deals on pre-owned items. Join thousands of sellers and buyers today!',
  keywords = 'second hand goods, used items, buy sell marketplace, pre-owned products, thrift store online, second hand store, resale platform, vintage items, refurbished goods',
  image = 'https://bestold.com/og-image.jpg',
  url,
  type = 'website',
  author = 'BESTOLD',
  publishedTime,
  modifiedTime,
  noindex = false,
  canonical,
  structuredData,
}: SEOProps) {
  const siteUrl = window.location.origin;
  const currentUrl = url || window.location.href;
  const canonicalUrl = canonical || currentUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="BESTOLD" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}

// Helper functions for structured data

export function createProductStructuredData(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: string;
  condition?: string;
  brand?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'USD',
      availability: product.availability || 'https://schema.org/InStock',
      itemCondition: product.condition || 'https://schema.org/UsedCondition',
    },
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.sku,
    aggregateRating: product.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 0,
        }
      : undefined,
  };
}

export function createStoreStructuredData(store: {
  name: string;
  description: string;
  image?: string;
  address?: string;
  telephone?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.description,
    image: store.image,
    address: store.address,
    telephone: store.telephone,
    email: store.email,
    aggregateRating: store.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: store.rating,
          reviewCount: store.reviewCount || 0,
        }
      : undefined,
  };
}

export function createBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
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

export function createOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BESTOLD',
    description: 'Multi-vendor marketplace for buying and selling second-hand goods',
    url: 'https://bestold.com',
    logo: 'https://bestold.com/logo.png',
    sameAs: [
      'https://facebook.com/bestold',
      'https://twitter.com/bestold',
      'https://instagram.com/bestold',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@bestold.com',
    },
  };
}

export function createWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BESTOLD',
    url: 'https://bestold.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://bestold.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}
