import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSiteSettingsByCategory } from '@/db/api';

export default function PrivacyPolicyPage() {
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
      const privacySetting = settings.find(s => s.key === 'privacy_policy_content');
      setContent(privacySetting?.value || getDefaultContent());
    } catch (error) {
      console.error('Failed to load privacy policy content:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
# Privacy Policy

**Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}**

## Introduction

Welcome to BestOld. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our platform.

## Information We Collect

### Personal Information
- Name and contact details (email, phone number)
- Account credentials (username, password)
- Profile information
- Location data (city/region)

### Transaction Information
- Product listings and descriptions
- Messages and communications
- Reviews and ratings
- Purchase and sales history

### Technical Information
- IP address and device information
- Browser type and version
- Usage data and analytics
- Cookies and similar technologies

## How We Use Your Information

We use your information to:

- **Provide Services**: Create and manage your account, process transactions, and facilitate communication between buyers and sellers
- **Improve Platform**: Analyze usage patterns, enhance user experience, and develop new features
- **Communication**: Send notifications, updates, and promotional materials (with your consent)
- **Security**: Detect and prevent fraud, abuse, and security incidents
- **Legal Compliance**: Comply with legal obligations and enforce our terms

## Information Sharing

We do not sell your personal information. We may share your data with:

- **Other Users**: Your public profile, listings, and reviews are visible to other users
- **Service Providers**: Third-party services that help us operate the platform (hosting, analytics, payment processing)
- **Legal Requirements**: When required by law or to protect our rights and safety

## Data Security

We implement appropriate technical and organizational measures to protect your data, including:

- Encryption of sensitive data
- Secure authentication systems
- Regular security audits
- Access controls and monitoring

## Your Rights

You have the right to:

- **Access**: Request a copy of your personal data
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request deletion of your account and data
- **Objection**: Opt-out of marketing communications
- **Portability**: Request your data in a portable format

## Cookies

We use cookies and similar technologies to:

- Remember your preferences
- Analyze site traffic and usage
- Provide personalized content
- Improve security

You can control cookies through your browser settings.

## Data Retention

We retain your data for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will remove or anonymize your personal data, except where retention is required by law.

## Children's Privacy

Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date.

## Contact Us

If you have questions about this privacy policy or our data practices, please contact us through:

- Feedback form in the footer
- Email support
- Contact information provided on our platform

---

By using BestOld, you agree to this privacy policy.
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
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
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
