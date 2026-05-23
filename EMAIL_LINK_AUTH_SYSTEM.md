# Email Link-Based Authentication System

## Overview

The authentication system has been updated to use **email link-based verification** instead of OTP codes for both user registration and password reset flows. This provides a more secure and user-friendly experience.

---

## What Changed

### 1. Registration Flow (Email Verification)

**Before (OTP-based):**
- User registers → Auto-logged in → No email verification

**After (Email Link-based):**
- User registers → Verification email sent → User clicks link → Email verified → User can log in

### 2. Password Reset Flow

**Before (OTP-based):**
- User requests reset → OTP sent to email → User enters OTP → User sets new password

**After (Email Link-based):**
- User requests reset → Reset link sent to email → User clicks link → User sets new password

---

## New Pages

### 1. ForgotPasswordPage (`/forgot-password`)
- User enters email address
- System sends password reset link via email
- Shows confirmation message with instructions

### 2. ResetPasswordPage (`/reset-password`)
- Handles password reset link callback
- Verifies the reset token
- Allows user to set new password
- Auto-signs out and redirects to login after success

### 3. EmailVerificationPage (`/verify-email`)
- Handles email verification link callback
- Verifies the email address
- Auto-signs in the user
- Redirects to home page

---

## How It Works

### Registration Flow

```
1. User fills registration form
   ↓
2. System creates account (unverified)
   ↓
3. Supabase sends verification email
   ↓
4. User sees "Check your email" message
   ↓
5. User clicks link in email
   ↓
6. Redirected to /verify-email
   ↓
7. Email verified & user signed in
   ↓
8. Redirected to home page
```

### Password Reset Flow

```
1. User clicks "Forgot Password"
   ↓
2. User enters email address
   ↓
3. Supabase sends reset link
   ↓
4. User sees "Check your email" message
   ↓
5. User clicks link in email
   ↓
6. Redirected to /reset-password
   ↓
7. User enters new password
   ↓
8. Password updated & user signed out
   ↓
9. Redirected to login page
```

---

## Email Configuration

### Supabase Auth Settings

The system uses Supabase's built-in email authentication. Make sure your Supabase project has:

1. **Email Auth Enabled**
   - Go to Authentication → Providers
   - Ensure "Email" is enabled

2. **Email Templates Configured**
   - Go to Authentication → Email Templates
   - Customize templates for:
     - Confirm signup
     - Reset password

3. **SMTP Settings** (Optional but recommended)
   - Go to Project Settings → Auth
   - Configure custom SMTP settings
   - Or use the email configuration in Admin → Email Configuration

### Redirect URLs

The following redirect URLs are configured:

- **Email Verification**: `{your-domain}/verify-email`
- **Password Reset**: `{your-domain}/reset-password`

These are set in the code:
- `AuthContext.tsx`: `emailRedirectTo: ${window.location.origin}/verify-email`
- `ForgotPasswordPage.tsx`: `redirectTo: ${window.location.origin}/reset-password`

---

## Security Features

### Email Verification
- ✅ Users must verify email before full access
- ✅ Verification links are single-use
- ✅ Links expire after a set time (configured in Supabase)
- ✅ Invalid/expired links show error message

### Password Reset
- ✅ Reset links are single-use
- ✅ Links expire after a set time (default: 1 hour)
- ✅ User is signed out after password change
- ✅ Old password is invalidated immediately

---

## User Experience

### Registration Success Screen

After registration, users see:

```
📧 Verification Email Sent!

We've sent a verification link to user@example.com.
Please check your inbox and click the link to verify your account.

ℹ️ Didn't receive the email?
• Check your spam or junk folder
• Make sure you entered the correct email address
• Wait a few minutes for the email to arrive

[Go to Login]
```

### Password Reset Success Screen

After requesting password reset, users see:

```
✅ Check Your Email

We sent you a password reset link

We've sent a password reset link to user@example.com.
Please check your inbox and click the link to reset your password.

ℹ️ Didn't receive the email?
• Check your spam or junk folder
• Make sure you entered the correct email address
• Wait a few minutes for the email to arrive

[Try Another Email]  [Back to Login]
```

---

## Testing

### Test Registration Flow

1. Go to `/register`
2. Fill in registration form
3. Click "Create Account"
4. Check email for verification link
5. Click link in email
6. Should be redirected to `/verify-email`
7. Should see success message
8. Should be auto-signed in
9. Should be redirected to home page

### Test Password Reset Flow

1. Go to `/forgot-password`
2. Enter email address
3. Click "Send Reset Link"
4. Check email for reset link
5. Click link in email
6. Should be redirected to `/reset-password`
7. Enter new password
8. Click "Reset Password"
9. Should see success message
10. Should be signed out
11. Should be redirected to login page
12. Log in with new password

---

## Troubleshooting

### Email Not Received

**Check Supabase Email Settings:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Verify templates are enabled
3. Check SMTP configuration

**Check Spam Folder:**
- Emails might be filtered as spam
- Add Supabase email to safe senders

**Check Email Configuration:**
- Go to Admin → Email Configuration
- Verify email service is configured
- Send test email to verify it works

### Verification Link Expired

**Solution:**
- User needs to register again
- Or request a new verification email (feature can be added)

**Prevention:**
- Configure longer expiration time in Supabase
- Go to Project Settings → Auth → Email Auth
- Adjust "Email confirmation expiry" setting

### Reset Link Expired

**Solution:**
- User needs to request a new reset link
- Go to `/forgot-password` again

**Prevention:**
- Configure longer expiration time in Supabase
- Go to Project Settings → Auth → Email Auth
- Adjust "Password recovery expiry" setting

### User Can't Log In After Registration

**Cause:**
- Email not verified yet

**Solution:**
- Check email for verification link
- Click the link to verify
- Then try logging in

**Alternative:**
- Disable email verification requirement in Supabase
- Go to Authentication → Providers → Email
- Uncheck "Confirm email"
- (Not recommended for production)

---

## Migration from OTP System

### Old System (Removed)

The following components were removed or replaced:

- ❌ `password_reset_otps` table (no longer needed)
- ❌ `send-password-reset-otp` Edge Function (replaced with Supabase Auth)
- ❌ `verify-password-reset-otp` Edge Function (replaced with Supabase Auth)
- ❌ `reset-password-with-otp` Edge Function (replaced with Supabase Auth)
- ❌ OTP input fields and verification steps

### New System (Added)

- ✅ `ResetPasswordPage.tsx` - Handles password reset callback
- ✅ `EmailVerificationPage.tsx` - Handles email verification callback
- ✅ Updated `ForgotPasswordPage.tsx` - Sends reset link instead of OTP
- ✅ Updated `RegisterPage.tsx` - Shows email verification message
- ✅ Updated `AuthContext.tsx` - Configured redirect URLs

### Database Changes

**No database changes required!**

The old `password_reset_otps` table can be kept (for historical data) or dropped:

```sql
-- Optional: Drop old OTP table
DROP TABLE IF EXISTS password_reset_otps;
```

### Edge Functions

The old OTP Edge Functions can be kept (they won't be called) or deleted:

```bash
# Optional: Delete old Edge Functions
rm -rf supabase/functions/send-password-reset-otp
rm -rf supabase/functions/verify-password-reset-otp
rm -rf supabase/functions/reset-password-with-otp
```

---

## Configuration

### Supabase Auth Configuration

1. **Email Templates**
   ```
   Go to: Authentication → Email Templates
   
   Confirm Signup Template:
   - Subject: Verify your email for BestOld
   - Body: Click the link below to verify your email address
   - Link: {{ .ConfirmationURL }}
   
   Reset Password Template:
   - Subject: Reset your password for BestOld
   - Body: Click the link below to reset your password
   - Link: {{ .ConfirmationURL }}
   ```

2. **Auth Settings**
   ```
   Go to: Project Settings → Auth
   
   Email Auth:
   - Enable email confirmations: ✅
   - Email confirmation expiry: 86400 (24 hours)
   - Password recovery expiry: 3600 (1 hour)
   
   Site URL: https://your-domain.com
   Redirect URLs: 
   - https://your-domain.com/verify-email
   - https://your-domain.com/reset-password
   ```

3. **SMTP Configuration** (Optional)
   ```
   Go to: Project Settings → Auth → SMTP Settings
   
   Or use: Admin → Email Configuration in your app
   ```

---

## Benefits of Email Link System

### Security
- ✅ More secure than OTP (no code to intercept)
- ✅ Single-use links
- ✅ Time-limited links
- ✅ No database storage needed for tokens

### User Experience
- ✅ One-click verification (no code to type)
- ✅ Works on any device (click link on phone, desktop, etc.)
- ✅ No risk of typos
- ✅ Cleaner, simpler flow

### Maintenance
- ✅ No custom Edge Functions to maintain
- ✅ No OTP table to manage
- ✅ Built-in Supabase functionality
- ✅ Automatic cleanup of expired links

---

## Support

If you encounter any issues:

1. Check Supabase logs: Dashboard → Logs → Auth
2. Check browser console for errors
3. Verify email configuration in Admin panel
4. Test with different email providers
5. Check spam/junk folders

---

## Summary

The authentication system now uses industry-standard email link verification for both registration and password reset. This provides better security, improved user experience, and easier maintenance compared to the previous OTP-based system.

**Key Changes:**
- ✅ Registration requires email verification
- ✅ Password reset uses email links
- ✅ No more OTP codes to type
- ✅ One-click verification
- ✅ Built-in Supabase Auth features
- ✅ No custom Edge Functions needed

**Next Steps:**
1. Test registration flow
2. Test password reset flow
3. Customize email templates in Supabase
4. Configure SMTP settings (optional)
5. Update any documentation or user guides
