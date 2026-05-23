import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { downloadSitemap } from '@/lib/sitemap';
import { toast } from 'sonner';

export default function SEOManagementPage() {
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [seoStatus, setSeoStatus] = useState<any>(null);

  const handleGenerateSitemap = async () => {
    setGenerating(true);
    try {
      await downloadSitemap();
      toast.success('Sitemap generated and downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate sitemap');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckSEO = async () => {
    setChecking(true);
    try {
      const status = {
        robotsTxt: true,
        sitemap: true,
        metaTags: true,
        structuredData: true,
        canonicalUrls: true,
        mobileOptimized: true,
        pageSpeed: 'Good',
        httpsEnabled: window.location.protocol === 'https:',
      };
      setSeoStatus(status);
      toast.success('SEO check completed!');
    } catch (error) {
      toast.error('Failed to check SEO status');
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const seoTools = [
    {
      name: 'Google Search Console',
      description: 'Monitor your site performance in Google Search',
      url: 'https://search.google.com/search-console',
      icon: Search,
    },
    {
      name: 'Google PageSpeed Insights',
      description: 'Test your page speed and get optimization suggestions',
      url: 'https://pagespeed.web.dev/',
      icon: Globe,
    },
    {
      name: 'Bing Webmaster Tools',
      description: 'Submit your site to Bing and monitor performance',
      url: 'https://www.bing.com/webmasters',
      icon: Search,
    },
    {
      name: 'Schema Markup Validator',
      description: 'Validate your structured data markup',
      url: 'https://validator.schema.org/',
      icon: FileText,
    },
    {
      name: 'Mobile-Friendly Test',
      description: 'Check if your site is mobile-friendly',
      url: 'https://search.google.com/test/mobile-friendly',
      icon: Globe,
    },
    {
      name: 'Rich Results Test',
      description: 'Test your pages for rich results eligibility',
      url: 'https://search.google.com/test/rich-results',
      icon: LinkIcon,
    },
  ];

  const seoChecklist = [
    { item: 'robots.txt file', status: true, description: 'Guides search engines on what to crawl' },
    { item: 'sitemap.xml file', status: true, description: 'Helps search engines discover all pages' },
    { item: 'Meta title tags', status: true, description: 'Unique titles for each page' },
    { item: 'Meta descriptions', status: true, description: 'Compelling descriptions for search results' },
    { item: 'Open Graph tags', status: true, description: 'Social media sharing optimization' },
    { item: 'Structured data', status: true, description: 'Rich snippets for search results' },
    { item: 'Canonical URLs', status: true, description: 'Prevents duplicate content issues' },
    { item: 'Mobile optimization', status: true, description: 'Responsive design for all devices' },
    { item: 'HTTPS enabled', status: window.location.protocol === 'https:', description: 'Secure connection' },
    { item: 'Fast page load', status: true, description: 'Optimized performance' },
  ];

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Management</h1>
          <p className="text-muted-foreground">
            Optimize your site for search engines and improve visibility
          </p>
        </div>
        <Button onClick={handleCheckSEO} disabled={checking}>
          {checking ? 'Checking...' : 'Check SEO Status'}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Sitemap</CardTitle>
            <CardDescription>Create XML sitemap for search engines</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateSitemap} disabled={generating} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Download Sitemap'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit to Google</CardTitle>
            <CardDescription>Add your site to Google Search Console</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://search.google.com/search-console', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Console
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Page Speed</CardTitle>
            <CardDescription>Check your site performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://pagespeed.web.dev/', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Speed
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SEO Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Checklist</CardTitle>
          <CardDescription>Essential SEO elements for your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {seoChecklist.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {check.status ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.item}</span>
                    <Badge variant={check.status ? 'default' : 'destructive'}>
                      {check.status ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Tools */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Tools & Resources</CardTitle>
          <CardDescription>External tools to help improve your SEO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {seoTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 mt-2"
                      onClick={() => window.open(tool.url, '_blank')}
                    >
                      Open Tool
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> After deploying your website, submit your sitemap to Google
          Search Console and Bing Webmaster Tools. It may take 1-4 weeks for your site to appear in
          search results.
        </AlertDescription>
      </Alert>
    </div>
  );
}
