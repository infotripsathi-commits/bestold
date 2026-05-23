import { HelmetProvider, Helmet } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/jsonld";

interface PageMetaProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonical?: string;
  additionalMeta?: Array<{ property?: string; name?: string; content: string }>;
  /** Optional JSON-LD schema objects to inject as <script type="application/ld+json"> */
  schemas?: object[];
}

export function PageMeta({ title, description, image, type = 'website', canonical, additionalMeta = [], schemas = [] }: PageMetaProps) {
  const fullTitle = title ? `${title} | BestOld` : "BestOld - Buy & Sell Second-Hand Goods";
  const defaultDescription = description || "BestOld is your trusted marketplace for buying and selling quality second-hand goods. Find great deals on electronics, furniture, clothing, and more from verified sellers in your area.";
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Normalize canonical URL: strip www, force https, strip query params for canonical
  const normalizedCanonical = canonical || (() => {
    if (!currentUrl) return '';
    try {
      const url = new URL(currentUrl);
      // Remove www subdomain for canonical consistency
      url.hostname = url.hostname.replace(/^www\./, '');
      url.protocol = 'https:';
      return url.toString().split('?')[0];
    } catch {
      return currentUrl;
    }
  })();

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={defaultDescription} />

      {/* Canonical URL to prevent duplicate content (www vs non-www) */}
      {normalizedCanonical && <link rel="canonical" href={normalizedCanonical} />}

      {/* Open Graph tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={defaultDescription} />
      <meta property="og:type" content={type} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {image && <meta property="og:image" content={image} />}

      {/* Additional meta tags */}
      {additionalMeta.map((meta, index) => {
        if (meta.property) {
          return <meta key={index} property={meta.property} content={meta.content} />;
        } else if (meta.name) {
          return <meta key={index} name={meta.name} content={meta.content} />;
        }
        return null;
      })}

      {/* JSON-LD Structured Data */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/** Standalone component for injecting extra JSON-LD schemas without other meta */
export function StructuredData({ schemas }: { schemas: object[] }) {
  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <TooltipProvider>
      {children}
    </TooltipProvider>
  </HelmetProvider>
);

/** Site-wide JSON-LD (Organization + WebSite) — render once in App.tsx */
export function SiteWideSchemas() {
  return (
    <StructuredData schemas={[buildOrganizationSchema(), buildWebSiteSchema()]} />
  );
}

export default PageMeta;
