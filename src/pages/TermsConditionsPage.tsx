import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSiteSettingsByCategory } from '@/db/api';

export default function TermsConditionsPage() {
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
      const termsSetting = settings.find(s => s.key === 'terms_conditions_content');
      setContent(termsSetting?.value || getDefaultContent());
    } catch (error) {
      console.error('Failed to load terms and conditions content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
# Terms and Conditions

**Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}**

## Agreement to Terms

By accessing and using BestOld, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our platform.

## User Accounts

### Registration
- You must provide accurate and complete information
- You must be at least 18 years old to create an account
- You are responsible for maintaining the security of your account
- You must notify us immediately of any unauthorized access

### Account Types
- **Buyer Account**: Browse and purchase products, leave reviews
- **Seller Account**: Create stores, list products, communicate with buyers
- Sellers must comply with additional seller requirements

## User Conduct

You agree NOT to:

- Post false, misleading, or fraudulent listings
- Engage in harassment, abuse, or threatening behavior
- Violate any laws or regulations
- Infringe on intellectual property rights
- Use automated systems to access the platform
- Attempt to manipulate reviews or ratings
- Share account credentials with others

## Product Listings

### Seller Responsibilities
- Provide accurate product descriptions and images
- Set fair and honest prices
- Disclose product condition truthfully
- Respond to buyer inquiries promptly
- Ship products as described and agreed

### Prohibited Items
Sellers may not list:
- Illegal or stolen goods
- Counterfeit or replica items
- Weapons or dangerous materials
- Adult content or services
- Items that violate intellectual property rights

## Transactions

### Buyer-Seller Agreement
- Transactions are directly between buyers and sellers
- BestOld facilitates communication but is not party to transactions
- Payment terms are agreed between buyer and seller
- Shipping and delivery are the seller's responsibility

### Disputes
- Users should attempt to resolve disputes directly
- BestOld may provide mediation assistance
- We reserve the right to suspend accounts involved in fraudulent activity

## Reviews and Ratings

- Reviews must be honest and based on actual experience
- Reviews should not contain offensive or inappropriate content
- Fake or manipulated reviews are prohibited
- We reserve the right to remove reviews that violate our policies

## Intellectual Property

### Platform Content
- BestOld owns all platform content, design, and functionality
- You may not copy, modify, or distribute our content without permission

### User Content
- You retain ownership of content you post
- You grant us a license to use, display, and distribute your content on the platform
- You are responsible for ensuring you have rights to content you post

## Privacy

Your use of BestOld is also governed by our Privacy Policy. Please review our Privacy Policy to understand our data practices.

## Fees and Payments

- Account creation is free
- We may charge fees for premium features or services
- All fees will be clearly disclosed before charging
- Fees are non-refundable unless otherwise stated

## Termination

### By You
- You may delete your account at any time
- Deletion may not be immediate due to legal retention requirements

### By Us
We may suspend or terminate your account if you:
- Violate these Terms and Conditions
- Engage in fraudulent or illegal activity
- Receive multiple complaints from other users
- Fail to respond to our communications

## Disclaimers

### Platform Availability
- We provide the platform "as is" without warranties
- We do not guarantee uninterrupted or error-free service
- We may modify or discontinue features at any time

### User Transactions
- We are not responsible for the quality, safety, or legality of items listed
- We do not guarantee the accuracy of user-provided information
- We are not liable for disputes between buyers and sellers

## Limitation of Liability

To the maximum extent permitted by law:
- We are not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount you paid us in the past 12 months
- We are not liable for user conduct or content

## Indemnification

You agree to indemnify and hold BestOld harmless from any claims, damages, or expenses arising from:
- Your use of the platform
- Your violation of these terms
- Your violation of any rights of others

## Governing Law

These Terms and Conditions are governed by the laws of the jurisdiction in which BestOld operates, without regard to conflict of law principles.

## Dispute Resolution

### Informal Resolution
We encourage users to contact us first to resolve disputes informally.

### Arbitration
If informal resolution fails, disputes will be resolved through binding arbitration rather than in court.

## Changes to Terms

We may update these Terms and Conditions from time to time. We will notify you of significant changes by:
- Posting the new terms on this page
- Updating the "Last Updated" date
- Sending email notification for material changes

Continued use of the platform after changes constitutes acceptance of the new terms.

## Contact Us

If you have questions about these Terms and Conditions, please contact us through:
- Feedback form in the footer
- Email support
- Contact information provided on our platform

## Severability

If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

## Entire Agreement

These Terms and Conditions, along with our Privacy Policy, constitute the entire agreement between you and BestOld.

---

By using BestOld, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
    `.trim();
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
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
          <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
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
              if (line.startsWith('**') && line.includes('**')) {
                const parts = line.split('**');
                return (
                  <p key={index} className="mb-3">
                    {parts.map((part, i) => 
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                    )}
                  </p>
                );
              }
              
              // Handle list items
              if (line.startsWith('- ')) {
                const text = line.substring(2);
                if (text.startsWith('**')) {
                  const parts = text.split('**');
                  return (
                    <li key={index} className="ml-6 mb-2">
                      {parts.map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                      )}
                    </li>
                  );
                }
                return <li key={index} className="ml-6 mb-2">{text}</li>;
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
