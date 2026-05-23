# Admin Invite System Documentation

## Overview

The Admin Invite System allows existing admins to generate secure invite links that can be used to create new admin, seller, or buyer accounts. This system provides a controlled way to onboard new users with specific roles.

## Features

1. **Generate Invite Links**: Create unique, time-limited invite tokens
2. **Role-Based Invites**: Specify the role (admin/seller/buyer) for the invitee
3. **Email Restriction**: Optionally restrict invites to specific email addresses
4. **Expiration Control**: Set custom expiration times (24 hours to 30 days)
5. **Invite Management**: View, copy, and revoke active invites
6. **Usage Tracking**: Track which invites have been used and by whom

## Accessing the Admin Invite Page

### Method 1: Through Admin Panel Navigation
1. Log in as an admin user
2. Navigate to the admin panel
3. Click on "Invites" in the navigation menu
4. URL: `https://your-domain.com/admin/invites`

### Method 2: Direct Link
Share this link with existing admins:
```
https://your-domain.com/admin/users
```
Note: Users must have an admin account to access this page.

## Generating Invite Links

### Step-by-Step Process

1. **Access the Invite Page**
   - Navigate to `/admin/invites`
   - Click the "Generate Invite" button

2. **Configure the Invite**
   - **Email (Optional)**: Enter a specific email address to restrict the invite
     - If provided, only this email can use the invite
     - If left blank, anyone with the link can register
   
   - **Role**: Select the account type
     - `Admin`: Full platform management access
     - `Seller`: Can create stores and list products
     - `Buyer`: Can browse and purchase items
   
   - **Expires In**: Choose the expiration period
     - 24 hours
     - 3 days
     - 7 days (default)
     - 14 days
     - 30 days

3. **Generate and Copy**
   - Click "Generate & Copy Link"
   - The invite link is automatically copied to your clipboard
   - Share the link with the intended recipient

### Example Invite Links

```
# General admin invite (anyone can use)
https://your-domain.com/register?invite=abc123xyz789

# Email-restricted invite
https://your-domain.com/register?invite=def456uvw012
```

## Using an Invite Link

### For Recipients

1. **Receive the Invite Link**
   - Get the invite link from an admin
   - Click the link or paste it into your browser

2. **Validate the Invite**
   - The system automatically validates the invite token
   - You'll see a green success message if valid
   - Error message if expired, invalid, or already used

3. **Complete Registration**
   - Fill in your details:
     - Full Name
     - Email (pre-filled if invite is email-restricted)
     - Phone Number
     - Password
     - Confirm Password
   - Account Type is automatically set by the invite
   - Click "Create Account"

4. **Email Verification**
   - Check your email for a verification link
   - Click the verification link to activate your account

5. **Access Your Dashboard**
   - After verification, log in with your credentials
   - You'll be redirected to the appropriate dashboard:
     - Admin → `/admin/users`
     - Seller → `/seller/dashboard`
     - Buyer → `/` (homepage)

## Managing Invites

### Viewing All Invites

The invite management page displays all generated invites with:
- **Status**: Active, Used, Revoked, or Expired
- **Role**: The assigned account type
- **Email**: Restricted email (if any)
- **Created By**: Admin who generated the invite
- **Created At**: Generation timestamp
- **Expires At**: Expiration timestamp
- **Used By**: User who registered with the invite (if used)

### Invite Statuses

| Status | Badge Color | Description |
|--------|-------------|-------------|
| Active | Blue | Valid and can be used |
| Used | Green | Successfully used for registration |
| Revoked | Red | Manually revoked by admin |
| Expired | Gray | Past expiration date |

### Copying Invite Links

1. Find the invite in the list
2. Click the copy icon (📋) in the Actions column
3. The full invite URL is copied to your clipboard
4. Share with the intended recipient

### Revoking Invites

1. Find the active invite you want to revoke
2. Click the trash icon (🗑️) in the Actions column
3. The invite is immediately revoked
4. The invite link will no longer work

## Quick Access Link

### Admin Panel Direct Link

Share this link to allow direct access to the admin panel:
```
https://your-domain.com/admin/users
```

**Important Notes:**
- Users must already have an admin account to access this link
- Non-admin users will see an "Access Denied" message
- Use the invite system to create new admin accounts first

## Security Features

### Token Security
- Tokens are 32-byte random strings encoded in base64
- URL-safe characters (no +, /, or =)
- Cryptographically secure random generation

### Validation Checks
- Token must exist in database
- Token must not be used
- Token must not be revoked
- Token must not be expired
- Email must match (if restricted)

### Database Policies
- Only admins can generate invites
- Only admins can view all invites
- Only admins can revoke invites
- Invite usage is tracked automatically

## Database Schema

### admin_invites Table

```sql
CREATE TABLE admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'admin',
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  used_by uuid REFERENCES profiles(id),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid REFERENCES profiles(id)
);
```

## API Functions

### generate_admin_invite()
```typescript
await generateAdminInvite(
  email?: string,           // Optional email restriction
  role: 'admin' | 'seller' | 'buyer' = 'admin',
  expiresInHours: number = 168  // Default 7 days
)
```

### validate_admin_invite()
```typescript
await validateAdminInvite(token: string)
// Returns: { valid: boolean, email?: string, role?: string, error?: string }
```

### mark_invite_used()
```typescript
await markInviteUsed(token: string, userId: string)
```

### revoke_admin_invite()
```typescript
await revokeAdminInvite(inviteId: string)
```

### getAllAdminInvites()
```typescript
await getAllAdminInvites()
// Returns array of all invites with creator and user details
```

## Common Use Cases

### Creating a New Admin User

1. Navigate to `/admin/invites`
2. Click "Generate Invite"
3. Set Role to "Admin"
4. Optionally enter the admin's email
5. Set expiration (recommend 7 days)
6. Click "Generate & Copy Link"
7. Send the link to the new admin via secure channel
8. They register and verify their email
9. They can now access the admin panel

### Onboarding Multiple Sellers

1. Generate multiple seller invites
2. Set longer expiration (14-30 days)
3. Share links with potential sellers
4. Track usage in the invite management page
5. Revoke unused invites after onboarding period

### Emergency Admin Access

1. Generate admin invite with 24-hour expiration
2. Restrict to specific email address
3. Share link immediately
4. Invite expires automatically after 24 hours

## Troubleshooting

### "Invalid or expired invite link"
- Check if the invite has expired
- Verify the token wasn't already used
- Confirm the invite wasn't revoked
- Generate a new invite if needed

### "This invite is only valid for [email]"
- The invite is restricted to a specific email
- Use the correct email address
- Contact the admin for a new invite

### "Only admins can generate invites"
- You must be logged in as an admin
- Check your account role in the profile
- Contact an existing admin for access

### Email Verification Not Received
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes for delivery
- Contact support if issue persists

## Best Practices

1. **Use Email Restrictions**: For sensitive roles (admin), always restrict to specific emails
2. **Set Appropriate Expiration**: Use shorter expiration for admin invites (24-72 hours)
3. **Revoke Unused Invites**: Regularly clean up unused invites
4. **Track Usage**: Monitor who uses invites and when
5. **Secure Sharing**: Share invite links through secure channels (encrypted email, secure messaging)
6. **Document Invites**: Keep records of who you invited and why
7. **Regular Audits**: Review active invites periodically

## Security Considerations

- Never share invite links publicly
- Use email restrictions for admin invites
- Set reasonable expiration times
- Revoke invites immediately if compromised
- Monitor invite usage regularly
- Use HTTPS for all invite links
- Educate recipients about phishing

## Support

For issues or questions about the admin invite system:
1. Check this documentation first
2. Review the troubleshooting section
3. Contact the platform administrator
4. Check the admin panel for invite status

---

**Last Updated**: 2026-03-24
**Version**: 1.0.0
