# Email Configuration System - Complete Guide

## Overview

A comprehensive email configuration management system that allows administrators to configure email service providers directly from the admin panel. The system supports multiple email providers (Resend, SendGrid, AWS SES) and automatically uses the configured service to send password reset OTPs and other notifications.

## Features

✅ **Admin Panel Configuration** - Configure email settings through the UI
✅ **Multiple Provider Support** - Resend, SendGrid, AWS SES, Custom
✅ **Test Email Functionality** - Send test emails to verify configuration
✅ **Active/Inactive Status** - Only one configuration can be active at a time
✅ **Secure API Key Storage** - API keys stored in database with visibility toggle
✅ **Automatic Integration** - Password reset OTPs automatically use configured service
✅ **Fallback to Development Mode** - Shows OTP in UI if no email service configured

## Architecture

### Database Schema

**Table: `email_configuration`**
```sql
CREATE TABLE email_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('resend', 'sendgrid', 'aws_ses', 'custom')),
  api_key text NOT NULL,
  sender_email text NOT NULL,
  sender_name text NOT NULL DEFAULT 'BestOld',
  is_active boolean NOT NULL DEFAULT false,
  test_email_sent boolean NOT NULL DEFAULT false,
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);
```

**Security:**
- RLS enabled - only admins can access
- Unique partial index ensures only one active configuration
- API keys can be hidden/shown in UI
- Automatic timestamp updates

### Edge Functions

#### 1. test-email-configuration
**Purpose:** Send test emails to verify email service configuration

**Endpoint:** `POST /functions/v1/test-email-configuration`

**Request:**
```json
{
  "configId": "uuid",
  "testEmail": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your inbox."
}
```

**Process:**
1. Fetch email configuration from database
2. Prepare test email HTML
3. Send email using configured provider
4. Return success/error status

#### 2. send-password-reset-otp (Updated)
**Purpose:** Send password reset OTP using configured email service

**Changes:**
- Now checks database for active email configuration
- Uses configured provider (Resend/SendGrid) to send emails
- Falls back to development mode if no configuration exists
- Returns OTP in response only when no email service is configured

**Flow:**
1. Generate OTP and store in database
2. Check for active email configuration
3. If configured: Send email via provider
4. If not configured: Return OTP in response (development mode)
5. Log all attempts for debugging

### Frontend Components

#### AdminEmailConfigPage
**Location:** `src/pages/admin/AdminEmailConfigPage.tsx`

**Features:**
- List all email configurations
- Add new configuration form
- Test email functionality
- Activate/deactivate configurations
- Delete configurations
- Show/hide API keys
- Setup guide

**UI Elements:**
- Provider selection dropdown (Resend, SendGrid, AWS SES, Custom)
- API key input with show/hide toggle
- Sender email and name fields
- Test email input and send button
- Active/Inactive badges
- Last tested timestamp
- Setup guide with step-by-step instructions

## User Guide

### For Administrators

#### Step 1: Access Email Configuration
1. Login as admin
2. Go to Admin Panel
3. Click "Email Config" in the navigation

#### Step 2: Add Email Configuration
1. Click "Add Configuration" button
2. Select email provider:
   - **Resend** (Recommended - easiest setup)
   - **SendGrid** (Industry standard)
   - **AWS SES** (Cost-effective at scale)
   - **Custom** (For other providers)
3. Enter API key from your provider
4. Enter sender email (must be verified with provider)
5. Enter sender name (default: "BestOld")
6. Click "Create Configuration"

#### Step 3: Test Configuration
1. Enter a test email address
2. Click "Send Test" button
3. Check your inbox for test email
4. Verify email formatting and delivery

#### Step 4: Activate Configuration
1. Click "Activate" button on the configuration
2. Only one configuration can be active at a time
3. Active configuration will be used for all emails

#### Step 5: Monitor Usage
- Check "Last tested" timestamp
- View "Tested" badge for verified configurations
- Monitor email delivery in provider dashboard

### For Developers

#### Database API Functions

```typescript
// Get active email configuration
const config = await getActiveEmailConfiguration();

// Get all configurations
const configs = await getAllEmailConfigurations();

// Create new configuration
const newConfig = await createEmailConfiguration({
  provider: 'resend',
  api_key: 're_xxxxx',
  sender_email: 'noreply@yourdomain.com',
  sender_name: 'BestOld',
  is_active: false,
});

// Update configuration
await updateEmailConfiguration(configId, {
  sender_name: 'New Name',
});

// Activate configuration (deactivates others)
await activateEmailConfiguration(configId);

// Delete configuration
await deleteEmailConfiguration(configId);
```

#### Edge Function Usage

```typescript
// Test email configuration
const { data, error } = await supabase.functions.invoke('test-email-configuration', {
  body: {
    configId: 'uuid',
    testEmail: 'test@example.com',
  },
});

// Send password reset OTP (automatically uses active configuration)
const { data, error } = await supabase.functions.invoke('send-password-reset-otp', {
  body: {
    email: 'user@example.com',
  },
});
```

## Provider Setup Guides

### Resend (Recommended)

**Why Resend?**
- Modern, developer-friendly API
- Generous free tier (100 emails/day)
- Fast setup (5 minutes)
- Great documentation
- React Email support

**Setup Steps:**

1. **Sign Up**
   - Go to https://resend.com
   - Create free account
   - Verify your email

2. **Verify Domain** (Optional but recommended)
   - Go to Domains section
   - Add your domain
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification (usually instant)

3. **Get API Key**
   - Go to API Keys section
   - Click "Create API Key"
   - Give it a name (e.g., "BestOld Production")
   - Copy the key (starts with `re_`)

4. **Configure in BestOld**
   - Go to Admin > Email Config
   - Click "Add Configuration"
   - Select "Resend"
   - Paste API key
   - Enter sender email (e.g., `noreply@yourdomain.com`)
   - Enter sender name (e.g., "BestOld")
   - Click "Create Configuration"

5. **Test**
   - Enter your email in test field
   - Click "Send Test"
   - Check inbox (and spam folder)
   - Verify email looks good

6. **Activate**
   - Click "Activate" button
   - Configuration is now live!

**Free Tier Limits:**
- 100 emails per day
- 3,000 emails per month
- Perfect for development and small projects

**Pricing:**
- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- Scale: Custom pricing

### SendGrid

**Why SendGrid?**
- Industry standard
- Reliable delivery
- Advanced features (templates, analytics)
- Good free tier

**Setup Steps:**

1. **Sign Up**
   - Go to https://sendgrid.com
   - Create free account
   - Complete email verification

2. **Verify Sender Identity**
   - Go to Settings > Sender Authentication
   - Choose "Single Sender Verification" (easiest)
   - Or "Domain Authentication" (recommended for production)
   - Follow verification steps

3. **Create API Key**
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Choose "Restricted Access"
   - Enable "Mail Send" permission
   - Copy the key (starts with `SG.`)

4. **Configure in BestOld**
   - Go to Admin > Email Config
   - Select "SendGrid"
   - Paste API key
   - Enter verified sender email
   - Test and activate

**Free Tier Limits:**
- 100 emails per day
- Forever free

**Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month for 50,000 emails
- Pro: $89.95/month for 100,000 emails

### AWS SES

**Why AWS SES?**
- Very cheap ($0.10 per 1,000 emails)
- Highly scalable
- Part of AWS ecosystem
- Best for high volume

**Setup Steps:**

1. **AWS Account**
   - Create AWS account if you don't have one
   - Go to AWS Console > SES

2. **Verify Email/Domain**
   - Go to Verified Identities
   - Add email or domain
   - Complete verification

3. **Request Production Access**
   - By default, SES is in sandbox mode
   - Go to Account Dashboard
   - Request production access
   - Wait for approval (usually 24 hours)

4. **Create IAM User**
   - Go to IAM > Users
   - Create new user for SES
   - Attach policy: `AmazonSESFullAccess`
   - Create access key
   - Save Access Key ID and Secret Access Key

5. **Configure in BestOld**
   - Go to Admin > Email Config
   - Select "AWS SES"
   - Enter Access Key ID as API key
   - Note: Full AWS SES integration requires additional setup
   - Consider using Resend or SendGrid for easier setup

**Pricing:**
- $0.10 per 1,000 emails
- No monthly fee
- Cheapest option for high volume

## Email Templates

### Password Reset OTP Email

The system uses a beautiful HTML email template for password reset OTPs:

**Features:**
- Gradient header with BestOld branding
- Large, centered OTP code (easy to read)
- Expiration warning (15 minutes)
- Security tips (don't share code)
- Professional footer
- Mobile-responsive design

**Template Location:**
`supabase/functions/send-password-reset-otp/index.ts`

**Customization:**
Edit the `emailHtml` variable to customize:
- Colors and branding
- Text content
- Layout and styling
- Footer information

### Test Email Template

**Features:**
- Success message with checkmark
- Configuration details (provider, sender, timestamp)
- Professional design
- Mobile-responsive

**Template Location:**
`supabase/functions/test-email-configuration/index.ts`

## Troubleshooting

### Email Not Received

**Check:**
1. ✅ Email configuration is active
2. ✅ API key is correct
3. ✅ Sender email is verified with provider
4. ✅ Recipient email is valid
5. ✅ Check spam/junk folder
6. ✅ Check provider dashboard for delivery status
7. ✅ Check Edge Function logs

**Common Issues:**
- **Unverified sender:** Verify your email/domain with provider
- **Invalid API key:** Regenerate key and update configuration
- **Rate limits:** Check if you've exceeded free tier limits
- **Spam filters:** Verify domain with SPF/DKIM/DMARC records

### Test Email Fails

**Solutions:**
1. Check API key is correct (no extra spaces)
2. Verify sender email with provider
3. Check provider dashboard for errors
4. Try different test email address
5. Check Edge Function logs for detailed errors

### Configuration Won't Activate

**Solutions:**
1. Ensure only one configuration is active at a time
2. Check database constraints
3. Verify admin permissions
4. Check browser console for errors

### OTP Still Shows in UI

**This is expected when:**
- No email configuration is set up
- Email configuration is inactive
- Email sending failed

**To fix:**
1. Add email configuration
2. Test configuration
3. Activate configuration
4. Try password reset again

## Security Best Practices

### API Key Management

1. **Never commit API keys to version control**
   - Store in database only
   - Use environment variables for Edge Functions if needed

2. **Rotate keys regularly**
   - Change API keys every 90 days
   - Update configuration after rotation

3. **Use restricted permissions**
   - Only grant "Mail Send" permission
   - Don't use full access keys

4. **Monitor usage**
   - Check provider dashboard regularly
   - Set up alerts for unusual activity

### Email Security

1. **Verify sender domain**
   - Add SPF, DKIM, DMARC records
   - Improves deliverability
   - Prevents spoofing

2. **Use HTTPS for all links**
   - All links in emails should use HTTPS
   - Verify SSL certificates

3. **Don't include sensitive data**
   - Never include passwords in emails
   - Use OTP codes that expire
   - Include security warnings

4. **Rate limiting**
   - Implement rate limits on OTP requests
   - Prevent abuse and spam

## Monitoring and Analytics

### Metrics to Track

1. **Delivery Rate**
   - % of emails successfully delivered
   - Target: > 95%

2. **Bounce Rate**
   - % of emails that bounced
   - Target: < 5%

3. **Open Rate** (if tracking enabled)
   - % of emails opened
   - Typical: 15-25%

4. **Spam Rate**
   - % of emails marked as spam
   - Target: < 1%

5. **Test Success Rate**
   - % of test emails that succeed
   - Target: 100%

### Provider Dashboards

**Resend:**
- Go to https://resend.com/emails
- View all sent emails
- Check delivery status
- View error logs

**SendGrid:**
- Go to Activity Feed
- View email statistics
- Check bounce/spam reports
- Monitor API usage

**AWS SES:**
- Go to SES Console > Sending Statistics
- View delivery metrics
- Check bounce/complaint rates
- Monitor reputation

## Cost Optimization

### Free Tier Strategies

1. **Start with Resend or SendGrid free tier**
   - 100 emails/day is enough for most small projects
   - Upgrade when you need more

2. **Monitor usage**
   - Track daily email count
   - Set up alerts before hitting limits

3. **Optimize email frequency**
   - Don't send unnecessary emails
   - Batch notifications when possible

### Scaling Up

**When to upgrade:**
- Consistently hitting free tier limits
- Need higher delivery rates
- Require advanced features (templates, analytics)

**Cost comparison (50,000 emails/month):**
- Resend: $20/month
- SendGrid: $19.95/month
- AWS SES: $5/month (but more complex setup)

**Recommendation:**
- < 3,000 emails/month: Free tier (Resend or SendGrid)
- 3,000 - 100,000 emails/month: Paid plan (Resend or SendGrid)
- > 100,000 emails/month: AWS SES (most cost-effective)

## Migration Guide

### From Development Mode to Production

1. **Choose provider** (Resend recommended)
2. **Sign up and verify** sender email/domain
3. **Get API key** from provider dashboard
4. **Add configuration** in Admin > Email Config
5. **Test thoroughly** with multiple email addresses
6. **Activate configuration**
7. **Monitor first 24 hours** for any issues

### Switching Providers

1. **Add new configuration** (don't delete old one yet)
2. **Test new configuration** thoroughly
3. **Activate new configuration** (old one auto-deactivates)
4. **Monitor for 24-48 hours**
5. **Delete old configuration** if everything works

## FAQ

**Q: Can I use multiple email providers at once?**
A: No, only one configuration can be active at a time. However, you can store multiple configurations and switch between them.

**Q: What happens if email sending fails?**
A: The system falls back to development mode and returns the OTP in the API response, which is displayed in the UI.

**Q: Can I use my Gmail account?**
A: Not recommended. Use a professional email service provider for better deliverability and features.

**Q: How do I know if emails are being sent?**
A: Check the "Last tested" timestamp and "Tested" badge. Also monitor your provider's dashboard.

**Q: Can I customize email templates?**
A: Yes, edit the `emailHtml` variable in the Edge Functions. You can customize colors, text, layout, etc.

**Q: Is my API key secure?**
A: Yes, API keys are stored in the database with RLS enabled. Only admins can access them. Use the show/hide toggle in the UI.

**Q: What if I exceed my free tier limit?**
A: Emails will fail to send. Upgrade your plan or wait for the limit to reset (usually daily).

**Q: Can I send emails to any address?**
A: In sandbox mode (AWS SES), you can only send to verified addresses. In production mode, you can send to any address.

## Support

**Documentation:**
- Resend: https://resend.com/docs
- SendGrid: https://docs.sendgrid.com
- AWS SES: https://docs.aws.amazon.com/ses

**BestOld Email System:**
- Admin Panel: `/admin/email-config`
- Edge Functions: `supabase/functions/`
- Database: `email_configuration` table

---

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** ✅ Production Ready
