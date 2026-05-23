// SEO Sitemap Generator for BESTOLD
// Generates a valid sitemap.xml using current canonical URLs.
//
// Key corrections vs the old version:
//  - Domain: uses bestold.in (not a runtime window.location which would be localhost/preview)
//  - Store URLs: /stores/:id  (not /store/:id)
//  - Product URLs: /products/:id  (not /product/:id)
//  - Removed /products (listing) — it redirects to /search; indexing it causes duplicate-content
//  - Removed /privacy-policy — it 301-redirects to /privacy; canonical is /privacy
//  - Added all real static pages: /search /stores /categories /about /privacy /terms /franchises
//  - Added /location/:slug pages (city landing pages that are publicly indexed)
//  - Paginates stores & products in 1 000-row batches to handle large catalogues
//  - approval_status field used correctly (not a non-existent "status" column)

import { supabase } from '@/db/supabase';

/** Canonical domain — update this when the domain changes */
const CANONICAL_DOMAIN = 'https://bestold.in';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch all rows from a Supabase query in 1 000-row pages */
async function fetchAllPaginated<T>(
  table: string,
  columns: string,
  filters: Record<string, string> = {},
  orderColumn = 'created_at'
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    for (const [col, val] of Object.entries(filters)) {
      query = query.eq(col, val);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

function buildXml(urls: SitemapUrl[]): string {
  const entries = urls
    .map((url) => {
      const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : '';
      const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : '';
      const priority = url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : '';
      return `  <url>\n    <loc>${url.loc}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateSitemap(): Promise<string> {
  const base = CANONICAL_DOMAIN;
  const urls: SitemapUrl[] = [];

  // ------------------------------------------------------------------
  // 1. Static pages
  // ------------------------------------------------------------------
  const today = new Date().toISOString().split('T')[0];

  urls.push(
    { loc: `${base}/`,            changefreq: 'daily',   priority: 1.0, lastmod: today },
    { loc: `${base}/search`,       changefreq: 'hourly',  priority: 0.9 },
    { loc: `${base}/stores`,       changefreq: 'daily',   priority: 0.9 },
    { loc: `${base}/categories`,   changefreq: 'weekly',  priority: 0.8 },
    { loc: `${base}/elite-partners`,   changefreq: 'weekly',  priority: 0.7 },
    { loc: `${base}/about`,        changefreq: 'monthly', priority: 0.5 },
    { loc: `${base}/privacy`,      changefreq: 'yearly',  priority: 0.3 },
    { loc: `${base}/terms`,        changefreq: 'yearly',  priority: 0.3 }
  );

  try {
    // ------------------------------------------------------------------
    // 2. City / location landing pages  (/location/:slug)
    // ------------------------------------------------------------------
    const locations = await fetchAllPaginated<{ value: string; updated_at: string }>(
      'locations',
      'value, updated_at',
      { is_active: 'true' },
      'display_order'
    );
    for (const loc of locations) {
      urls.push({
        loc: `${base}/location/${loc.value}`,
        lastmod: loc.updated_at ? new Date(loc.updated_at).toISOString().split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: 0.8,
      });
    }

    // ------------------------------------------------------------------
    // 3. Approved stores  (/stores/:id)
    // ------------------------------------------------------------------
    const stores = await fetchAllPaginated<{ id: string; updated_at: string }>(
      'stores',
      'id, updated_at',
      { approval_status: 'approved' },
      'updated_at'
    );
    for (const store of stores) {
      urls.push({
        loc: `${base}/stores/${store.id}`,
        lastmod: new Date(store.updated_at).toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      });
    }

    // ------------------------------------------------------------------
    // 4. Active products  (/products/:id)
    // ------------------------------------------------------------------
    const products = await fetchAllPaginated<{ id: string; updated_at: string }>(
      'products',
      'id, updated_at',
      { status: 'active' },
      'updated_at'
    );
    for (const product of products) {
      urls.push({
        loc: `${base}/products/${product.id}`,
        lastmod: new Date(product.updated_at).toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 0.7,
      });
    }

  } catch (error) {
    console.error('[sitemap] Error fetching dynamic URLs:', error);
    // Return partial sitemap with static pages rather than failing entirely
  }

  return buildXml(urls);
}

// ---------------------------------------------------------------------------
// Download helper (for admin use)
// ---------------------------------------------------------------------------
export async function downloadSitemap() {
  const xml = await generateSitemap();
  const blob = new Blob([xml], { type: 'application/xml' });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
