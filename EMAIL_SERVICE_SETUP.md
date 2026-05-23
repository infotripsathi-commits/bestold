# Email Service Setup Guide for Forgot Password

## Current Status

⚠️ **Email service is NOT configured** - OTPs are currently displayed in the UI for development/testing only.

In production, you MUST integrate an email service provider to send OTP codes to users' email addresses.

## Development Mode

Currently, when a user requests a password reset:
1. ✅ OTP is generated and stored in database
2. ✅ OTP is returned in API response (development only)
3. ✅ OTP is displayed in a yellow banner on the verification page
4. ❌ Email is NOT sent to the user

**This is intentional for development/testing purposes.**

## How to Test (Development)

1. Go to `/forgot-password`
2. Enter a registered email address
3. Click "Send Verification Code"
4. **Look for the yellow banner** that appears on the next screen
5. The OTP code will be displayed in large text
6. Copy and paste the OTP into the verification field
7. Continue with password reset

## Production Setup Options

### Option 1: Resend (Recommended - Easiest)

**Why Resend?**
- Modern, developer-friendly API
- Generous free tier (100 emails/day)
- React Email support
- Great documentation
- Fast delivery

**Setup Steps:**

1. **Sign up for Resend**
   - Go to https://resend.com
   - Create a free account
   - Verify your domain (or use their test domain)

2. **Get API Key**
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Add to Supabase Secrets**
   ```bash
   # Using Supabase CLI
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   
   # Or use the Supabase dashboard:
   # Project Settings > Edge Functions > Secrets
   ```

4. **Update Edge Function**
   
   Edit `supabase/functions/send-password-reset-otp/index.ts`:

   ```typescript
   // Add at the top of the file
   import { Resend } from 'npm:resend@2.0.0';

   // Inside the Deno.serve function, after generating OTP:
   const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

   try {
     await resend.emails.send({
       from: 'BestOld <noreply@yourdomain.com>', // Use your verified domain
       to: email,
       subject: 'Password Reset - Your OTP Code',
       html: emailHtml, // Use the existing emailHtml template
     });

     console.log(`OTP email sent to ${email}`);
     
     // Return success WITHOUT the OTP in production
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: 'OTP sent successfully. Please check your email.'
       }),
       { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (emailError) {
     console.error('Error sending email:', emailError);
     return new Response(
       JSON.stringify({ error: 'Failed to send email. Please try again.' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
   ```

5. **Remove Development Mode**
   - Remove the line that includes OTP in response
   - Remove `...(Deno.env.get('ENVIRONMENT') === 'development' && { otp: otpCode })`

6. **Deploy Updated Function**
   ```bash
   supabase functions deploy send-password-reset-otp
   ```

### Option 2: SendGrid

**Why SendGrid?**
- Industry standard
- Free tier (100 emails/day)
- Reliable delivery
- Advanced features

**Setup Steps:**

1. **Sign up for SendGrid**
   - Go to https://sendgrid.com
   - Create a free account
   - Verify your sender identity

2. **Get API Key**
   - Go to Settings > API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the key (starts with `SG.`)

3. **Add to Supabase Secrets**
   ```bash
   supabase secrets set SENDGRID_API_KEY=SG.your_api_key_here
   ```

4. **Update Edge Function**

   ```typescript
   // Inside the Deno.serve function:
   const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
   
   const emailData = {
     personalizations: [{
       to: [{ email }],
       subject: 'Password Reset - Your OTP Code'
     }],
     from: { email: 'noreply@yourdomain.com', name: 'BestOld' },
     content: [{
       type: 'text/html',
       value: emailHtml
     }]
   };

   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${sendGridApiKey}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(emailData)
   });

   if (!response.ok) {
     throw new Error('Failed to send email');
   }
   ```

### Option 3: AWS SES

**Why AWS SES?**
- Very cheap ($0.10 per 1,000 emails)
- Highly scalable
- Part of AWS ecosystem

**Setup Steps:**

1. **Set up AWS SES**
   - Go to AWS Console > SES
   - Verify your domain or email
   - Request production access (if needed)

2. **Create IAM User**
   - Create IAM user with SES send permissions
   - Get Access Key ID and Secret Access Key

3. **Add to Supabase Secrets**
   ```bash
   supabase secrets set AWS_ACCESS_KEY_ID=your_access_key
   supabase secrets set AWS_SECRET_ACCESS_KEY=your_secret_key
   supabase secrets set AWS_REGION=us-east-1
   ```

4. **Update Edge Function**
   - Use AWS SDK for JavaScript
   - Implement SES sendEmail API call

### Option 4: Supabase Auth Email (Limited)

**Note:** Supabase Auth doesn't support custom OTP emails directly, but you can use their password reset flow:

**Alternative Approach:**
Instead of OTP, use Supabase's built-in password reset with magic links:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

This sends a magic link to the user's email, but doesn't use OTP codes.

## Recommended Production Configuration

### 1. Choose Email Provider
- **For small projects:** Resend (easiest setup)
- **For established projects:** SendGrid (reliable)
- **For AWS users:** AWS SES (cheapest at scale)

### 2. Update Environment Variables

Set `ENVIRONMENT=production` to disable development features:

```bash
supabase secrets set ENVIRONMENT=production
```

### 3. Update Frontend

The frontend will automatically hide the OTP banner when `data.otp` is not returned from the API.

### 4. Test Email Delivery

Before going live:
1. Test with your own email
2. Check spam folder
3. Verify email formatting
4. Test with different email providers (Gmail, Outlook, etc.)
5. Monitor delivery rates

## Email Template Customization

The current email template is in `supabase/functions/send-password-reset-otp/index.ts`.

**To customize:**
1. Edit the `emailHtml` variable
2. Update colors, branding, text
3. Test with different email clients
4. Ensure mobile responsiveness

**Current template includes:**
- BestOld branding with gradient header
- Large, centered OTP code
- Expiration warning (15 minutes)
- Security tips
- Professional footer

## Monitoring Email Delivery

### Track These Metrics:
- **Delivery rate:** % of emails successfully delivered
- **Open rate:** % of emails opened (if tracking enabled)
- **Bounce rate:** % of emails that bounced
- **Spam rate:** % of emails marked as spam

### Set Up Alerts:
- Alert when delivery rate drops below 95%
- Alert when bounce rate exceeds 5%
- Alert when spam rate exceeds 1%

## Troubleshooting

### OTP Not Received

**Check:**
1. ✅ Email service is configured
2. ✅ API keys are correct
3. ✅ Sender email is verified
4. ✅ User's email is valid
5. ✅ Check spam folder
6. ✅ Check email service logs
7. ✅ Check Edge Function logs

**Common Issues:**
- **Unverified sender:** Verify your domain/email with provider
- **Rate limits:** Check if you've exceeded free tier limits
- **Invalid API key:** Regenerate and update secrets
- **Blocked domain:** Some providers block certain domains

### Email Goes to Spam

**Solutions:**
1. Verify your domain with SPF, DKIM, DMARC records
2. Use a professional sender email (not @gmail.com)
3. Avoid spam trigger words in subject/content
4. Include unsubscribe link (for marketing emails)
5. Maintain good sender reputation

## Cost Estimates

### Free Tiers:
- **Resend:** 100 emails/day (3,000/month)
- **SendGrid:** 100 emails/day (3,000/month)
- **AWS SES:** 62,000 emails/month (if using EC2)

### Paid Plans:
- **Resend:** $20/month for 50,000 emails
- **SendGrid:** $19.95/month for 50,000 emails
- **AWS SES:** $0.10 per 1,000 emails (no monthly fee)

### Recommendation:
- **< 3,000 emails/month:** Use free tier (Resend or SendGrid)
- **3,000 - 50,000 emails/month:** Paid plan (Resend or SendGrid)
- **> 50,000 emails/month:** AWS SES (most cost-effective)

## Security Best Practices

1. **Never log OTP codes in production**
   - Remove all `console.log` statements with OTP
   - Remove OTP from API responses

2. **Use environment variables**
   - Never hardcode API keys
   - Use Supabase secrets management

3. **Implement rate limiting**
   - Limit OTP requests per email (5 per hour)
   - Limit OTP requests per IP (10 per hour)

4. **Monitor for abuse**
   - Track failed verification attempts
   - Alert on suspicious patterns
   - Implement CAPTCHA if needed

5. **Secure email content**
   - Use HTTPS for all links
   - Don't include sensitive information
   - Include security warnings

## Quick Start Checklist

- [ ] Choose email provider (Resend recommended)
- [ ] Sign up and verify domain/email
- [ ] Get API key
- [ ] Add API key to Supabase secrets
- [ ] Update Edge Function with email sending code
- [ ] Remove development mode features
- [ ] Deploy updated Edge Function
- [ ] Test with your email
- [ ] Test with different email providers
- [ ] Monitor delivery in production

## Support

If you need help setting up email service:

1. **Resend Docs:** https://resend.com/docs
2. **SendGrid Docs:** https://docs.sendgrid.com
3. **AWS SES Docs:** https://docs.aws.amazon.com/ses
4. **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Current Status:** ⚠️ Development Mode (OTP displayed in UI)  
**Production Ready:** ❌ Email service required  
**Estimated Setup Time:** 15-30 minutes  
**Recommended Provider:** Resend (easiest setup)
