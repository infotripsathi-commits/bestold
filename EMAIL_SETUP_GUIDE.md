# 📧 Email Setup Guide for OTP Configuration

## Overview

BestOld uses email services to send OTP (One-Time Password) codes for password reset functionality. This guide will help you configure email services for your platform.

---

## 🎯 Quick Start

### Step 1: Access Email Configuration
1. Login as **Admin**
2. Navigate to **Admin Dashboard**
3. Click on **Email Configuration** in the sidebar
4. Click **Add Configuration** button

### Step 2: Choose Email Provider
We support multiple email providers:
- **Resend** (Recommended - Easy setup, generous free tier)
- **SendGrid** (Popular, reliable)
- **AWS SES** (Enterprise-grade, cost-effective at scale)
- **Custom** (For other SMTP providers)

---

## 📨 Recommended Provider: Resend

### Why Resend?
- ✅ **Free Tier**: 3,000 emails/month free
- ✅ **Easy Setup**: Simple API, no complex configuration
- ✅ **Fast Delivery**: Excellent deliverability rates
- ✅ **Developer Friendly**: Great documentation and support
- ✅ **No Credit Card**: Free tier doesn't require payment info

### Resend Setup Instructions

#### 1. Create Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Click **Sign Up** (free account)
3. Verify your email address
4. Complete account setup

#### 2. Add Your Domain (Recommended)
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain:
   - **SPF Record**: Add TXT record for email authentication
   - **DKIM Record**: Add TXT record for email signing
   - **DMARC Record**: Add TXT record for email policy
5. Wait for DNS propagation (5-30 minutes)
6. Verify domain in Resend dashboard

**Example DNS Records:**
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [Provided by Resend]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

#### 3. Get API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `BestOld Production`
4. Select permission: **Sending access**
5. Click **Create**
6. **Copy the API key** (you won't see it again!)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 4. Configure in BestOld
1. Go to **Admin Dashboard** → **Email Configuration**
2. Click **Add Configuration**
3. Fill in the form:
   - **Provider**: Select `Resend (Recommended)`
   - **API Key**: Paste your Resend API key
   - **Sender Email**: `noreply@yourdomain.com` (must match verified domain)
   - **Sender Name**: `BestOld` (or your platform name)
4. Click **Save Configuration**

#### 5. Test Configuration
1. Find your new configuration in the list
2. Enter your email in the **Test Email** field
3. Click **Send Test Email**
4. Check your inbox for test email
5. If successful, click **Activate** to make it the active configuration

---

## 📮 Alternative Provider: SendGrid

### Why SendGrid?
- ✅ **Free Tier**: 100 emails/day free forever
- ✅ **Reliable**: Industry-standard email service
- ✅ **Analytics**: Detailed email tracking and analytics
- ✅ **Templates**: Email template management

### SendGrid Setup Instructions

#### 1. Create SendGrid Account
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Click **Start for Free**
3. Complete registration
4. Verify your email address

#### 2. Verify Sender Identity
**Option A: Single Sender Verification (Quick)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter sender details:
   - From Name: `BestOld`
   - From Email: `noreply@yourdomain.com`
   - Reply To: Your support email
4. Click **Create**
5. Check email and click verification link

**Option B: Domain Authentication (Recommended)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain
4. Add DNS records provided by SendGrid
5. Wait for verification (5-30 minutes)

#### 3. Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `BestOld Production`
4. Permission: **Restricted Access**
   - Enable: **Mail Send** → **Full Access**
5. Click **Create & View**
6. **Copy the API key** (starts with `SG.`)

#### 4. Configure in BestOld
1. Go to **Admin Dashboard** → **Email Configuration**
2. Click **Add Configuration**
3. Fill in the form:
   - **Provider**: Select `SendGrid`
   - **API Key**: Paste your SendGrid API key
   - **Sender Email**: Your verified sender email
   - **Sender Name**: `BestOld`
4. Click **Save Configuration**
5. Test and activate

---

## ☁️ Enterprise Provider: AWS SES

### Why AWS SES?
- ✅ **Cost-Effective**: $0.10 per 1,000 emails
- ✅ **Scalable**: Handle millions of emails
- ✅ **Reliable**: 99.9% uptime SLA
- ✅ **AWS Integration**: Works with other AWS services

### AWS SES Setup Instructions

#### 1. Create AWS Account
1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Create account or sign in
3. Navigate to **SES** (Simple Email Service)

#### 2. Verify Email/Domain
1. In SES console, go to **Verified Identities**
2. Click **Create Identity**
3. Choose **Domain** (recommended) or **Email**
4. Add DNS records to verify domain
5. Wait for verification

#### 3. Request Production Access
1. In SES console, go to **Account Dashboard**
2. Click **Request production access**
3. Fill out the form:
   - Use case: Transactional emails
   - Website URL: Your platform URL
   - Describe use case: Password reset OTP codes
4. Submit request (usually approved within 24 hours)

#### 4. Create IAM User and Access Keys
1. Go to **IAM** console
2. Create new user: `bestold-ses-sender`
3. Attach policy: `AmazonSESFullAccess`
4. Create access keys
5. Save **Access Key ID** and **Secret Access Key**

#### 5. Configure in BestOld
1. Go to **Admin Dashboard** → **Email Configuration**
2. Click **Add Configuration**
3. Fill in the form:
   - **Provider**: Select `AWS SES`
   - **API Key**: Paste your AWS Access Key ID
   - **Sender Email**: Your verified SES email
   - **Sender Name**: `BestOld`
4. Click **Save Configuration**
5. Test and activate

**Note**: AWS SES requires additional configuration in the Edge Function code to use AWS SDK.

---

## 🔧 Configuration Fields Explained

### Provider
The email service you want to use. Each provider has different features and pricing.

### API Key
Your authentication credential from the email provider. Keep this secret!
- **Resend**: Starts with `re_`
- **SendGrid**: Starts with `SG.`
- **AWS SES**: AWS Access Key ID

### Sender Email
The email address that will appear in the "From" field.
- Must be verified with your email provider
- Use a professional address: `noreply@yourdomain.com`
- Avoid free email providers (Gmail, Yahoo) for production

### Sender Name
The name that will appear in the "From" field.
- Use your platform name: `BestOld`
- Keep it short and recognizable
- Avoid special characters

---

## ✅ Testing Your Configuration

### Test Email Process
1. After saving configuration, find it in the list
2. Enter your email address in the **Test Email** field
3. Click **Send Test Email** button
4. Check your inbox (and spam folder)
5. You should receive a test email within 1-2 minutes

### What to Check
- ✅ Email arrives in inbox (not spam)
- ✅ Sender name displays correctly
- ✅ Sender email is correct
- ✅ Email content is formatted properly
- ✅ No broken images or links

### If Test Fails
1. **Check API Key**: Make sure it's copied correctly
2. **Verify Sender Email**: Must be verified with provider
3. **Check DNS Records**: Domain verification may be pending
4. **Review Logs**: Check browser console for error messages
5. **Provider Dashboard**: Check provider's dashboard for errors

---

## 🚀 Activating Configuration

### How to Activate
1. After successful test, click **Activate** button
2. Only one configuration can be active at a time
3. Active configuration is used for all OTP emails
4. You can switch between configurations anytime

### Active Configuration Badge
- **Green Badge**: Configuration is active
- **Gray Badge**: Configuration is inactive
- **Test Sent**: Shows if test email was sent successfully

---

## 📊 Email Configuration Management

### Multiple Configurations
You can add multiple email configurations:
- **Primary**: Your main email service (active)
- **Backup**: Fallback if primary fails
- **Testing**: For development and testing

### Switching Providers
1. Add new provider configuration
2. Test the new configuration
3. Activate the new configuration
4. Old configuration becomes inactive
5. Keep old configuration as backup

### Deleting Configurations
1. Click **Delete** button (trash icon)
2. Confirm deletion
3. Cannot delete active configuration
4. Deactivate first, then delete

---

## 🔐 Security Best Practices

### API Key Security
- ✅ Never share API keys publicly
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically (every 90 days)
- ✅ Revoke keys if compromised
- ✅ Use restricted permissions when possible

### Email Security
- ✅ Always verify your domain
- ✅ Set up SPF, DKIM, and DMARC records
- ✅ Use professional sender addresses
- ✅ Monitor email deliverability
- ✅ Handle bounces and complaints

### Rate Limiting
- ✅ Respect provider rate limits
- ✅ Implement retry logic for failures
- ✅ Monitor email sending volume
- ✅ Set up alerts for failures

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to send test email"
**Possible Causes:**
- Invalid API key
- Sender email not verified
- Domain not verified
- API key lacks permissions
- Rate limit exceeded

**Solutions:**
- Double-check API key (no extra spaces)
- Verify sender email in provider dashboard
- Complete domain verification
- Check API key permissions
- Wait and retry

#### 2. "Email not received"
**Possible Causes:**
- Email in spam folder
- DNS records not propagated
- Provider blocking emails
- Incorrect sender email

**Solutions:**
- Check spam/junk folder
- Wait 30 minutes for DNS propagation
- Check provider dashboard for blocks
- Verify sender email matches verified domain

#### 3. "Configuration not activating"
**Possible Causes:**
- Test email not sent successfully
- Database connection issue
- Permission error

**Solutions:**
- Send test email first
- Refresh the page
- Check browser console for errors
- Verify admin permissions

#### 4. "OTP not sending to users"
**Possible Causes:**
- No active configuration
- Email service down
- API key expired
- Rate limit reached

**Solutions:**
- Activate a configuration
- Check provider status page
- Regenerate API key
- Upgrade provider plan

---

## 📈 Monitoring and Maintenance

### What to Monitor
1. **Email Delivery Rate**: Should be >95%
2. **Bounce Rate**: Should be <5%
3. **Spam Complaints**: Should be <0.1%
4. **API Usage**: Stay within free tier limits
5. **Response Times**: Emails should send within seconds

### Regular Maintenance
- **Weekly**: Check email delivery stats
- **Monthly**: Review API usage and costs
- **Quarterly**: Rotate API keys
- **Yearly**: Review and update DNS records

### Provider Dashboards
- **Resend**: [https://resend.com/dashboard](https://resend.com/dashboard)
- **SendGrid**: [https://app.sendgrid.com](https://app.sendgrid.com)
- **AWS SES**: [https://console.aws.amazon.com/ses](https://console.aws.amazon.com/ses)

---

## 💰 Cost Comparison

### Free Tier Limits

| Provider | Free Tier | Cost After Free Tier |
|----------|-----------|---------------------|
| **Resend** | 3,000 emails/month | $20/month for 50,000 emails |
| **SendGrid** | 100 emails/day (3,000/month) | $19.95/month for 50,000 emails |
| **AWS SES** | 62,000 emails/month (if using EC2) | $0.10 per 1,000 emails |

### Recommendation by Scale
- **Small (<3,000 emails/month)**: Resend or SendGrid free tier
- **Medium (3,000-50,000 emails/month)**: Resend paid plan
- **Large (>50,000 emails/month)**: AWS SES
- **Enterprise (>1M emails/month)**: AWS SES with dedicated IP

---

## 🎓 Additional Resources

### Documentation
- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **SendGrid Docs**: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- **AWS SES Docs**: [https://docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses)

### Support
- **Resend Support**: [support@resend.com](mailto:support@resend.com)
- **SendGrid Support**: [https://support.sendgrid.com](https://support.sendgrid.com)
- **AWS Support**: [https://aws.amazon.com/support](https://aws.amazon.com/support)

### Community
- **Resend Discord**: [https://discord.gg/resend](https://discord.gg/resend)
- **SendGrid Community**: [https://community.sendgrid.com](https://community.sendgrid.com)
- **AWS Forums**: [https://forums.aws.amazon.com](https://forums.aws.amazon.com)

---

## 📝 Quick Reference

### Resend Configuration
```
Provider: Resend
API Key: re_xxxxxxxxxxxxxxxxxxxx
Sender Email: noreply@yourdomain.com
Sender Name: BestOld
```

### SendGrid Configuration
```
Provider: SendGrid
API Key: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Sender Email: noreply@yourdomain.com
Sender Name: BestOld
```

### Testing Checklist
- [ ] API key copied correctly
- [ ] Sender email verified
- [ ] Domain DNS records added
- [ ] Configuration saved
- [ ] Test email sent successfully
- [ ] Test email received in inbox
- [ ] Configuration activated
- [ ] OTP emails working for users

---

## 🆘 Need Help?

If you're still having issues after following this guide:

1. **Check Logs**: Look at browser console and Edge Function logs
2. **Provider Status**: Check if your email provider is experiencing issues
3. **Documentation**: Review provider's documentation
4. **Support**: Contact your email provider's support team
5. **Community**: Ask in provider's community forums

---

## ✨ Best Practices Summary

1. ✅ **Use Resend** for easiest setup and best free tier
2. ✅ **Verify your domain** for better deliverability
3. ✅ **Test thoroughly** before activating
4. ✅ **Monitor email stats** regularly
5. ✅ **Keep API keys secure** and rotate them
6. ✅ **Set up DNS records** properly (SPF, DKIM, DMARC)
7. ✅ **Use professional sender addresses** (no Gmail/Yahoo)
8. ✅ **Have a backup configuration** ready
9. ✅ **Stay within rate limits** to avoid blocks
10. ✅ **Review costs** as your platform grows

---

**Last Updated**: March 29, 2026  
**Version**: 1.0  
**Platform**: BestOld Second-Hand Marketplace
