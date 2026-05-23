# How to Access Delivery Charge Settings

## Quick Access Guide

The delivery charge management feature is now accessible in **THREE** easy ways:

---

## Method 1: Admin Dashboard (MOST PROMINENT) ⭐

1. **Navigate to Admin Dashboard**:
   - Go to `/admin` or click "Admin" in the main navigation

2. **Look for the Blue Card**:
   - Right at the top of the dashboard
   - Shows: "Current Delivery Charge: ₹50"
   - Blue/primary colored card with Sliders icon

3. **Click "Manage Settings" Button**:
   - Takes you directly to Platform Settings page
   - Edit delivery charge and other settings

```
┌─────────────────────────────────────────────────────┐
│ 🎚️ Current Delivery Charge: ₹50                    │
│    Configure delivery charges and other platform    │
│    settings                                         │
│                                   [Manage Settings] │
└─────────────────────────────────────────────────────┘
```

---

## Method 2: Quick Actions Section

1. **Scroll down on Admin Dashboard**:
   - Find "Quick Actions" card
   - Located below the statistics

2. **Click "Platform Settings" Button**:
   - Fourth button in the grid
   - Has Sliders icon
   - Direct access to settings page

```
Quick Actions
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ⏰ Review    │ │ 👥 Manage    │ │ 📦 Manage    │ │ 🎚️ Platform  │
│   Approvals  │ │   Users      │ │   Products   │ │   Settings   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Method 3: Admin Navigation Menu

1. **Look at the horizontal navigation bar**:
   - Located at the top of all admin pages
   - Scroll horizontally if needed

2. **Find "Platform Settings"**:
   - Between "Payment Settings" and "Featured Plans"
   - Has Sliders icon
   - Click to access

```
Admin Navigation (scroll horizontally →)
[Dashboard] [Approvals] ... [Payment Settings] [Platform Settings] [Featured Plans] ...
```

---

## What You'll See on the Platform Settings Page

### Page Layout

```
Platform Settings
Configure platform-wide settings and pricing

┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ 🛒 Delivery Charge  │ │ % Platform Fee      │ │ ₹ Min Order Amount  │
│                     │ │                     │ │                     │
│ Value: [50]         │ │ Value: [2]          │ │ Value: [100]        │
│                     │ │                     │ │                     │
│ Last updated:       │ │ Last updated:       │ │ Last updated:       │
│ 5/11/2026           │ │ 5/11/2026           │ │ 5/11/2026           │
│                     │ │                     │ │                     │
│ [Save Changes]      │ │ [Save Changes]      │ │ [Save Changes]      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

About Platform Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 Delivery Charge
   Standard delivery fee added to all orders. Customers see this at checkout.

% Platform Fee
   Percentage fee charged on each transaction. Deducted from seller's earnings.

₹ Minimum Order Amount
   Minimum order value required to place an order.

⚠️ Important: Changes take effect immediately for all new orders.
```

---

## How to Change Delivery Charge

### Step-by-Step Instructions

1. **Access Platform Settings** (use any method above)

2. **Find "Delivery Charge (₹)" Card**:
   - First card on the left
   - Has shopping cart icon 🛒

3. **Enter New Value**:
   - Click in the "Value" input field
   - Type new amount (e.g., 75)
   - Can use decimals (e.g., 49.99)

4. **Click "Save Changes" Button**:
   - Button will be enabled when value changes
   - Shows loading state while saving

5. **Confirmation**:
   - Success message appears
   - Timestamp updates to current date/time
   - New charge applies immediately

### Example

**Current**: ₹50
**Want to change to**: ₹75

1. Click in value field
2. Clear current value
3. Type: 75
4. Click "Save Changes"
5. See: "Setting updated successfully" ✅
6. New orders now use ₹75 delivery charge

---

## Validation Rules

### What's Allowed
✅ Positive numbers (e.g., 50, 75, 100)
✅ Decimal values (e.g., 49.99, 75.50)
✅ Zero (0) for free delivery

### What's NOT Allowed
❌ Negative numbers (e.g., -50)
❌ Text or letters (e.g., "fifty")
❌ Special characters (e.g., $, ₹ symbols)

**Note**: Enter only the number. The ₹ symbol is added automatically.

---

## Where Delivery Charge Appears

### Customer Checkout Page

```
Order Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quantity:                          1
Subtotal:                 ₹40,999.00
Delivery Charge:              ₹50.00  ← Your setting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                    ₹41,049.00

[Place Order]
```

### Admin Dashboard

```
Current Delivery Charge: ₹50  ← Shows current value
```

---

## Troubleshooting

### Problem: Can't find Platform Settings

**Solution 1**: Use Admin Dashboard
- Go to `/admin`
- Look for blue card at top
- Click "Manage Settings"

**Solution 2**: Direct URL
- Type in browser: `your-domain.com/admin/platform-settings`
- Or: `/admin/platform-settings`

**Solution 3**: Check Admin Role
- Only admin users can access
- Verify your account has admin role

### Problem: Changes not saving

**Check**:
- ✅ You have admin role
- ✅ Entered valid number (positive)
- ✅ Clicked "Save Changes" button
- ✅ Saw success message

**If still failing**:
- Check browser console for errors
- Try refreshing the page
- Try logging out and back in

### Problem: Delivery charge not updating on checkout

**Solution**:
- Refresh the checkout page
- Clear browser cache
- Verify setting saved in admin panel
- Check admin dashboard shows new value

---

## Quick Reference

| Feature | Location | Icon | Action |
|---------|----------|------|--------|
| **Delivery Charge Card** | Admin Dashboard (top) | 🎚️ Sliders | Click "Manage Settings" |
| **Quick Actions** | Admin Dashboard (bottom) | 🎚️ Sliders | Click "Platform Settings" |
| **Navigation Menu** | All admin pages (top bar) | 🎚️ Sliders | Click "Platform Settings" |
| **Direct URL** | Browser address bar | - | `/admin/platform-settings` |

---

## Summary

✅ **THREE ways to access**: Dashboard card, Quick Actions, Navigation menu

✅ **Most visible**: Blue card at top of admin dashboard

✅ **Easy to find**: "Current Delivery Charge: ₹50" text

✅ **One-click access**: "Manage Settings" button

✅ **Immediate effect**: Changes apply to all new orders instantly

---

## Screenshots Reference

### Admin Dashboard - Top Section
```
Admin Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────┐
│ 🎚️ Current Delivery Charge: ₹50                                        │
│    Configure delivery charges and other platform settings               │
│                                                      [Manage Settings]   │
└─────────────────────────────────────────────────────────────────────────┘
                              ↑
                    CLICK THIS BUTTON
                    TO EDIT DELIVERY CHARGE
```

### Platform Settings Page
```
Platform Settings
Configure platform-wide settings and pricing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────┐
│ 🛒 Delivery Charge (₹)          │
│                                 │
│ Default delivery charge in      │
│ rupees                          │
│                                 │
│ Value                           │
│ ┌─────────────────────────────┐ │
│ │ 50                          │ │ ← EDIT THIS
│ └─────────────────────────────┘ │
│                                 │
│ Last updated: 5/11/2026         │
│                                 │
│ [💾 Save Changes]               │ ← CLICK TO SAVE
└─────────────────────────────────┘
```

---

**Need Help?**

If you still can't find the delivery charge settings:
1. Go to `/admin` (Admin Dashboard)
2. Look for the BLUE CARD at the very top
3. It says "Current Delivery Charge: ₹50"
4. Click the "Manage Settings" button on the right
5. You'll see the delivery charge input field

**It's now impossible to miss!** 🎯
