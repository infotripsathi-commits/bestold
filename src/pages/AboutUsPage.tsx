import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSiteSettingsByCategory } from '@/db/api';

export default function AboutUsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const settings = await getSiteSettingsByCategory('general');
      const aboutSetting = settings.find(s => s.key === 'about_us_content');
      setContent(aboutSetting?.value || getDefaultContent());
    } catch (error) {
      console.error('Failed to load about us content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
# About BestOld

Welcome to BestOld, your trusted marketplace for buying and selling quality second-hand goods.

## Our Mission

At BestOld, we believe in giving products a second life. Our mission is to create a sustainable marketplace where buyers can find quality pre-owned items at great prices, and sellers can easily reach customers looking for value.

## What We Offer

### For Buyers
- Wide selection of quality second-hand products
- Verified sellers and stores
- Secure messaging with sellers
- Location-based search
- Product reviews and ratings

### For Sellers
- Easy store setup and management
- Product listing tools
- Direct communication with buyers
- Store analytics and insights
- Review and rating system
- Promotional features

## Why Choose BestOld?

**Quality Assurance**: We maintain high standards for product listings and seller verification.

**Trust & Safety**: Our platform includes buyer protection, secure messaging, and verified seller profiles.

**Sustainability**: By promoting the reuse of quality goods, we contribute to a more sustainable future.

**Community**: We're building a community of conscious buyers and sellers who value quality and sustainability.

## Our Values

- **Transparency**: Clear communication and honest product descriptions
- **Sustainability**: Promoting reuse and reducing waste
- **Trust**: Building a safe and reliable marketplace
- **Community**: Supporting local sellers and buyers

## Contact Us

Have questions or feedback? We'd love to hear from you! Use the feedback button in the footer or contact us through our support channels.

---

Thank you for being part of the BestOld community!
    `.trim();
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">About Us</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
            {content.split('\n').map((line, index) => {
              // Handle headings
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
              }
              
              // Handle bold text
              if (line.startsWith('**') && line.endsWith('**')) {
                const text = line.substring(2, line.length - 2);
                const parts = text.split('**: ');
                if (parts.length === 2) {
                  return (
                    <p key={index} className="mb-3">
                      <strong>{parts[0]}:</strong> {parts[1]}
                    </p>
                  );
                }
              }
              
              // Handle list items
              if (line.startsWith('- ')) {
                return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>;
              }
              
              // Handle horizontal rule
              if (line === '---') {
                return <hr key={index} className="my-8 border-border" />;
              }
              
              // Handle empty lines
              if (line.trim() === '') {
                return <div key={index} className="h-2" />;
              }
              
              // Regular paragraphs
              return <p key={index} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
