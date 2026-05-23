# Your Admin Account Information

## 🔐 Your Admin Credentials

**Admin Email/ID**: `info.sotpic@gmail.com`  
**Admin Name**: ts enterprise  
**Role**: Admin  
**Account Created**: March 25, 2026

**Password**: You need to use the password you set when you created this account.

### If You Forgot Your Password

1. Go to the login page: `/login`
2. Click "Forgot Password?" link
3. Enter your email: `info.sotpic@gmail.com`
4. Check your email for the password reset link
5. Click the link and set a new password
6. Log in with your new password

---

## 📧 How to Invite Someone from Admin Panel

### Step-by-Step Guide

#### Step 1: Log In to Admin Panel

1. Go to the login page: `/login`
2. Enter your credentials:
   - **Email**: `info.sotpic@gmail.com`
   - **Password**: Your password
3. Click "Sign In"
4. You'll be redirected to the admin dashboard

#### Step 2: Navigate to Invites Page

1. Look at the admin navigation bar at the top
2. Click on **"Invites"** (it has a user-plus icon)
3. Or directly go to: `/admin/invites`

#### Step 3: Generate an Invite Link

1. Click the **"Generate Invite"** button (blue button with plus icon)
2. A dialog will open with a form

#### Step 4: Fill in the Invite Details

**Option A: For Creating a New Admin User**
```
Email (Optional): admin@example.com  [Enter the new admin's email]
Role: Admin                          [Select from dropdown]
Expires In: 7 days                   [Select from dropdown]
```

**Option B: For Creating a Seller Account**
```
Email (Optional): seller@example.com [Enter the seller's email]
Role: Seller                         [Select from dropdown]
Expires In: 14 days                  [Select from dropdown]
```

**Option C: For Creating a Buyer Account**
```
Email (Optional): [Leave blank or enter email]
Role: Buyer                          [Select from dropdown]
Expires In: 7 days                   [Select from dropdown]
```

#### Step 5: Generate and Copy the Link

1. Click **"Generate & Copy Link"** button
2. You'll see a success message: "Invite link generated and copied to clipboard!"
3. The invite link is now in your clipboard

#### Step 6: Share the Invite Link

1. Open your email client or messaging app
2. Paste the link (Ctrl+V or Cmd+V)
3. Send it to the person you want to invite

**Example invite link:**
```
https://your-domain.com/register?invite=abc123xyz789def456ghi012jkl345mno678pqr
```

#### Step 7: Track the Invite

1. Return to `/admin/invites`
2. You'll see your invite in the table
3. Check the **Status** column:
   - 🔵 **Active**: Not used yet, waiting for recipient
   - 🟢 **Used**: Successfully used for registration
   - 🔴 **Revoked**: You cancelled it
   - ⚪ **Expired**: Past the expiration date

---

## 🎯 Quick Examples

### Example 1: Invite a New Admin (Recommended Settings)

```
Purpose: Add a new admin to help manage the platform
Settings:
  - Email: newadmin@company.com (REQUIRED for security)
  - Role: Admin
  - Expires In: 24 hours (short expiration for security)
  
Steps:
1. Go to /admin/invites
2. Click "Generate Invite"
3. Enter: newadmin@company.com
4. Select: Admin
5. Select: 24 hours
6. Click "Generate & Copy Link"
7. Send link via secure email
8. Monitor usage within 24 hours
```

### Example 2: Invite Multiple Sellers

```
Purpose: Onboard several sellers to the platform
Settings:
  - Email: [Leave blank] (anyone can use)
  - Role: Seller
  - Expires In: 30 days (flexible timeline)
  
Steps:
1. Generate 5 seller invites with 30-day expiration
2. Share links with potential sellers
3. They can register anytime within 30 days
4. Check /admin/invites to see who registered
```

### Example 3: Invite a Specific Buyer

```
Purpose: Give VIP access to a specific customer
Settings:
  - Email: vip@customer.com (restricted to this email)
  - Role: Buyer
  - Expires In: 7 days
  
Steps:
1. Generate invite with their email
2. Send them the link
3. Only they can use it (email-restricted)
4. Expires in 7 days if not used
```

---

## 🔄 Managing Existing Invites

### View All Invites

1. Go to `/admin/invites`
2. Scroll down to see the "All Invites" table
3. You'll see all invites you've created

### Copy an Existing Invite Link

1. Find the invite in the table
2. Look for the **Actions** column
3. Click the **copy icon** (📋)
4. The link is copied to your clipboard
5. Share it again

### Revoke an Invite

1. Find the invite you want to cancel
2. Click the **trash icon** (🗑️) in the Actions column
3. Confirm the action
4. The invite is immediately revoked
5. The link will no longer work

---

## 📱 What Recipients See

### When They Click the Invite Link

1. **Validation Screen**
   - Green success message: "Valid invite! Registering as [role]"
   - Or error message if expired/invalid

2. **Registration Form**
   - Full Name field
   - Email field (pre-filled if you specified an email)
   - Phone Number field
   - Password field
   - Confirm Password field
   - Account Type (automatically set, cannot change)

3. **After Registration**
   - Success message
   - Email verification required
   - Redirect to appropriate dashboard:
     - Admin → `/admin/users`
     - Seller → `/seller/dashboard`
     - Buyer → `/` (homepage)

---

## ⚠️ Important Security Tips

### For Admin Invites (CRITICAL)
- ✅ **ALWAYS** specify the email address
- ✅ Use short expiration (24-72 hours)
- ✅ Share via secure channel (encrypted email)
- ✅ Verify recipient identity before sending
- ✅ Monitor usage immediately
- ✅ Revoke if not used within expected time

### For Seller/Buyer Invites
- ✅ Email restriction optional
- ✅ Can use longer expiration (7-30 days)
- ✅ Monitor usage regularly
- ✅ Revoke after onboarding period ends

---

## 🆘 Troubleshooting

### "I can't access /admin/invites"
**Solution**: Make sure you're logged in with your admin account (info.sotpic@gmail.com)

### "The invite link doesn't work"
**Possible reasons**:
- Invite expired (check expiration date)
- Invite already used (check status)
- Invite was revoked (check status)
- Wrong email used (if email-restricted)

**Solution**: Generate a new invite

### "I forgot which invites I sent"
**Solution**: 
1. Go to `/admin/invites`
2. Check the table
3. Look at "Created At" and "Email" columns
4. Check "Used By" to see who registered

### "How do I know if someone used my invite?"
**Solution**:
1. Go to `/admin/invites`
2. Find the invite in the table
3. Check the "Status" column:
   - 🟢 **Used** = Someone registered
4. Check the "Used By" column to see who

---

## 📞 Quick Reference

```
┌─────────────────────────────────────────────────────┐
│  YOUR ADMIN ACCOUNT                                 │
├─────────────────────────────────────────────────────┤
│  Email: info.sotpic@gmail.com                       │
│  Name:  ts enterprise                               │
│  Role:  Admin                                       │
├─────────────────────────────────────────────────────┤
│  IMPORTANT LINKS                                    │
├─────────────────────────────────────────────────────┤
│  Login:         /login                              │
│  Admin Panel:   /admin/users                        │
│  Invites:       /admin/invites                      │
│  Dashboard:     /admin                              │
└─────────────────────────────────────────────────────┘
```

---

## 🎬 Complete Workflow Example

**Scenario**: You want to add a new admin named "John Doe" with email "john@company.com"

1. **Log in**
   - Go to `/login`
   - Email: `info.sotpic@gmail.com`
   - Password: [your password]
   - Click "Sign In"

2. **Navigate to Invites**
   - Click "Invites" in the admin navigation
   - Or go to `/admin/invites`

3. **Generate Invite**
   - Click "Generate Invite" button
   - Email: `john@company.com`
   - Role: `Admin`
   - Expires In: `24 hours`
   - Click "Generate & Copy Link"

4. **Send Invite**
   - Open your email
   - Compose new email to john@company.com
   - Subject: "Admin Access to SecondSwap"
   - Body: "Hi John, here's your admin invite link: [paste link]"
   - Send email

5. **Monitor Usage**
   - Return to `/admin/invites`
   - Wait for John to register
   - Status will change from 🔵 Active to 🟢 Used
   - "Used By" will show "John Doe"

6. **Verify Access**
   - Go to `/admin/users`
   - Find "John Doe" in the user list
   - Verify role is "Admin"
   - Done! John can now access the admin panel

---

**Need more help?** Check the full documentation in `ADMIN_INVITE_SYSTEM.md`
