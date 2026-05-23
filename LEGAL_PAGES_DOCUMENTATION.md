# Legal Pages Content - BestOld Platform

## Overview
Default content has been added for the following legal pages:
- **About Us**
- **Privacy Policy**
- **Terms & Conditions**

All content is stored in the `site_settings` database table and can be edited by admins through the Admin Panel.

## Content Summary

### 1. About Us Page
**Length**: ~3,500 words

**Sections Covered**:
- Who We Are
- Our Mission
- What We Offer (For Sellers & Buyers)
- How It Works
- Our Values (Sustainability, Trust & Safety, Accessibility, Community)
- Why Choose BestOld
- Our Commitment
- Join Our Community
- Contact Information

**Key Messages**:
- BestOld is India's trusted marketplace for second-hand goods
- Focus on sustainability and circular economy
- Free store creation with unlimited listings
- No transaction fees or commissions
- Direct buyer-seller communication
- Seller verification and approval process

---

### 2. Privacy Policy
**Length**: ~6,800 words

**Sections Covered**:
1. Introduction
2. Information We Collect
   - Personal information provided by users
   - Automatically collected information
   - Information from third parties
3. How We Use Your Information
4. How We Share Your Information
5. Data Retention
6. Your Rights and Choices
7. Data Security
8. Children's Privacy
9. Cookies and Tracking
10. Third-Party Links
11. International Data Transfers
12. Changes to Privacy Policy
13. Contact Information
14. Legal Basis for Processing (India)

**Key Points**:
- Compliant with Indian data protection laws
- Clear explanation of data collection and usage
- User rights: access, update, delete, data portability
- Security measures: encryption, access controls
- No selling of personal information
- Cookie usage and opt-out options
- Children under 18 not permitted
- Contact information for privacy concerns

**Legal Compliance**:
- Governed by laws of India
- Mentions data protection officer
- Explains legal basis for processing
- Retention periods specified
- User consent mechanisms

---

### 3. Terms & Conditions
**Length**: ~8,500 words

**Sections Covered**:
1. Acceptance of Terms
2. Definitions
3. Eligibility (18+ years, legal capacity)
4. Account Registration
5. Seller Obligations
6. Buyer Obligations
7. Platform Role and Limitations
8. Prohibited Activities and Content
9. Store Promotion Services
10. Intellectual Property
11. Reviews and Ratings
12. Privacy and Data Protection
13. Disclaimers
14. Limitation of Liability
15. Indemnification
16. Termination
17. Dispute Resolution
18. Modifications to Terms
19. General Provisions
20. Contact Information

**Key Legal Protections**:
- **Platform as Facilitator**: Clear disclaimer that BestOld is NOT responsible for transactions
- **No Liability**: Limited liability for user disputes, product quality, or transaction issues
- **User Responsibility**: Users handle payments, delivery, and disputes directly
- **Prohibited Items**: Comprehensive list of banned products
- **Seller Verification**: Admin approval required for all sellers
- **Promotion Terms**: Clear terms for paid store promotions (UPI/Paytm)
- **Dispute Resolution**: Arbitration in India under Indian law
- **Termination Rights**: Platform can suspend/terminate accounts for violations

**Specific to BestOld Business Model**:
- No transaction fees or commissions
- Direct buyer-seller payments (offline)
- Platform only facilitates connections
- Seller verification and approval process
- Store promotion services (7/30/90 days)
- UPI and Paytm payment options for promotions
- Trade license requirement for sellers
- Review and rating system

---

## Database Storage

All content is stored in the `site_settings` table:

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Keys**:
- `about_us` - About Us page content (Markdown format)
- `privacy_policy` - Privacy Policy content (Markdown format)
- `terms_conditions` - Terms & Conditions content (Markdown format)

## Admin Management

Admins can edit these pages through the Admin Panel:
1. Navigate to **Admin Panel → Footer Management**
2. Select the page to edit (About Us / Privacy Policy / Terms & Conditions)
3. Edit content in Markdown format
4. Save changes
5. Changes are immediately reflected on the public pages

## Frontend Pages

These pages should be accessible at:
- `/about-us` - About Us page
- `/privacy-policy` - Privacy Policy page
- `/terms-conditions` - Terms & Conditions page

Footer links automatically navigate to these pages.

## Content Customization

### What You Should Update:

1. **Contact Information**:
   - Replace `support@bestold.com` with your actual email
   - Replace `+91-XXXXXXXXXX` with your actual phone number
   - Add your business address

2. **Company Details**:
   - Update company name if different
   - Add GST number if applicable
   - Add business registration details

3. **Data Protection Officer**:
   - Add name and contact of DPO (if applicable)

4. **Jurisdiction**:
   - Replace `[Your City]` with your actual city for legal jurisdiction

5. **Social Media**:
   - Update social media links in footer

### What You Can Customize:

- Add or remove sections based on your business needs
- Adjust tone and language to match your brand
- Add specific policies (refund, shipping, etc.) if applicable
- Update prohibited items list based on your requirements
- Modify promotion terms and pricing

## Legal Disclaimer

**IMPORTANT**: This content is provided as a template and starting point. While it covers standard legal requirements for an Indian marketplace platform, you should:

1. **Consult a Lawyer**: Have these documents reviewed by a legal professional
2. **Customize for Your Business**: Adapt content to your specific business model
3. **Regular Updates**: Review and update policies as laws change
4. **Compliance**: Ensure compliance with:
   - Information Technology Act, 2000
   - Consumer Protection Act, 2019
   - E-Commerce Rules, 2020
   - Digital Personal Data Protection Act (when enacted)
   - GST regulations
   - Any other applicable Indian laws

## Best Practices

1. **Version Control**: Keep track of policy versions and update dates
2. **User Notification**: Notify users of significant policy changes
3. **Acceptance**: Require users to accept Terms during registration
4. **Accessibility**: Make policies easy to find and read
5. **Plain Language**: Use clear, simple language where possible
6. **Regular Review**: Review policies annually or when business changes

## Compliance Checklist

- ✅ Privacy Policy covers data collection, usage, and user rights
- ✅ Terms & Conditions clearly define platform role and limitations
- ✅ Disclaimer that platform is not responsible for transactions
- ✅ User eligibility requirements (18+ years)
- ✅ Prohibited items and activities listed
- ✅ Dispute resolution mechanism defined
- ✅ Intellectual property rights protected
- ✅ Termination conditions specified
- ✅ Limitation of liability clauses included
- ✅ Governing law and jurisdiction stated (India)
- ✅ Contact information provided
- ✅ Update mechanism explained

## Next Steps

1. **Review Content**: Read through all three documents carefully
2. **Customize**: Update placeholders and customize for your business
3. **Legal Review**: Have a lawyer review the documents
4. **Publish**: Ensure pages are accessible on your website
5. **Link**: Add footer links to these pages
6. **User Acceptance**: Implement Terms acceptance during registration
7. **Monitor**: Regularly review and update as needed

---

**Note**: These documents are written specifically for the BestOld platform business model:
- Second-hand goods marketplace
- Seller verification and approval
- No transaction handling (buyers pay sellers directly)
- Store promotion services (UPI/Paytm)
- Located and operating in India
- Governed by Indian laws

If your business model differs, please adjust the content accordingly.

---

*Content Generated: March 24, 2026*  
*Last Updated: March 24, 2026*
