# Admin Invite System - Quick Start Guide

## 🚀 Quick Start

### For Admins: Creating New Admin Users

1. **Access the Invite Page**
   ```
   Navigate to: /admin/invites
   ```

2. **Generate an Admin Invite**
   - Click "Generate Invite" button
   - Fill in the form:
     - **Email**: Enter the new admin's email (recommended for security)
     - **Role**: Select "Admin"
     - **Expires In**: Choose "7 days" (default)
   - Click "Generate & Copy Link"
   - The invite link is now in your clipboard!

3. **Share the Link**
   - Send the copied link to the new admin via secure channel
   - Example link format:
     ```
     https://your-domain.com/register?invite=abc123xyz789
     ```

4. **Track Usage**
   - Return to `/admin/invites` to see if the invite was used
   - Check the "Status" column for updates

### For Recipients: Using an Invite Link

1. **Click the Invite Link**
   - You'll be taken to the registration page
   - You'll see a green success message: "Valid invite! Registering as admin"

2. **Complete Registration**
   - Fill in your details:
     - Full Name
     - Email (may be pre-filled)
     - Phone Number
     - Password (minimum 6 characters)
     - Confirm Password
   - Account Type is automatically set to "Admin"
   - Click "Create Account"

3. **Verify Your Email**
   - Check your email inbox
   - Click the verification link
   - Your account is now active!

4. **Log In**
   - Go to `/login`
   - Enter your email and password
   - You'll be redirected to `/admin/users`

## 📋 Common Tasks

### Creating Multiple Admin Users

```bash
# Generate 3 admin invites with different expirations
1. admin1@example.com - 24 hours (urgent)
2. admin2@example.com - 7 days (standard)
3. admin3@example.com - 14 days (flexible)
```

### Revoking an Invite

1. Go to `/admin/invites`
2. Find the invite in the list
3. Click the trash icon (🗑️) in the Actions column
4. The invite is immediately revoked

### Copying an Existing Invite Link

1. Go to `/admin/invites`
2. Find the active invite
3. Click the copy icon (📋)
4. Share the link again

## 🔗 Important Links

### Admin Panel Access
```
Direct Link: https://your-domain.com/admin/users
Note: Requires existing admin account
```

### Invite Management
```
Invite Page: https://your-domain.com/admin/invites
```

### Registration with Invite
```
Format: https://your-domain.com/register?invite=TOKEN
```

## ⚠️ Important Notes

1. **Email Restrictions**: When you specify an email, only that email can use the invite
2. **One-Time Use**: Each invite can only be used once
3. **Expiration**: Invites expire after the set time period
4. **Security**: Always use email restrictions for admin invites
5. **Revocation**: Revoke unused invites to maintain security

## 🎯 Best Practices

### For Admin Invites
- ✅ Always restrict to specific email
- ✅ Use short expiration (24-72 hours)
- ✅ Share via secure channel
- ✅ Revoke if not used within expected time

### For Seller/Buyer Invites
- ✅ Can use longer expiration (7-30 days)
- ✅ Email restriction optional
- ✅ Monitor usage regularly
- ✅ Revoke after onboarding period

## 🆘 Troubleshooting

### "Invalid or expired invite link"
**Solution**: Generate a new invite and share the new link

### "This invite is only valid for [email]"
**Solution**: Use the correct email address or request a new invite

### "Only admins can generate invites"
**Solution**: You need admin access. Contact an existing admin.

### Email verification not received
**Solution**: 
1. Check spam/junk folder
2. Wait 5 minutes
3. Try registering again

## 📊 Invite Status Guide

| Status | What It Means | Can Copy? | Can Revoke? |
|--------|---------------|-----------|-------------|
| 🔵 Active | Ready to use | ✅ Yes | ✅ Yes |
| 🟢 Used | Already registered | ❌ No | ❌ No |
| 🔴 Revoked | Manually cancelled | ❌ No | ❌ No |
| ⚪ Expired | Past expiration date | ❌ No | ❌ No |

## 🔐 Security Checklist

Before generating an admin invite:
- [ ] Verified the recipient's identity
- [ ] Using their correct email address
- [ ] Set appropriate expiration time
- [ ] Will share via secure channel
- [ ] Will monitor for usage
- [ ] Will revoke if not used in time

## 📞 Need Help?

1. Read the full documentation: `ADMIN_INVITE_SYSTEM.md`
2. Check the troubleshooting section above
3. Contact the platform administrator

---

**Quick Reference Card**

```
┌─────────────────────────────────────────────┐
│  ADMIN INVITE SYSTEM - QUICK REFERENCE      │
├─────────────────────────────────────────────┤
│  Generate Invite:  /admin/invites           │
│  Admin Panel:      /admin/users             │
│  Register:         /register?invite=TOKEN   │
├─────────────────────────────────────────────┤
│  Default Expiration: 7 days                 │
│  Token Length: 43 characters                │
│  One-Time Use: Yes                          │
│  Email Restriction: Optional                │
└─────────────────────────────────────────────┘
```
