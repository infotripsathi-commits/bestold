# UPI Payment Integration Guide

## Overview
This application now supports **direct UPI payments** to your UPI ID for store promotion payments. This is a cost-effective alternative to payment gateways, perfect for Indian businesses.

## ✨ Features
- **Direct UPI Payments**: Receive payments directly to your UPI ID
- **No Gateway Fees**: Eliminate payment gateway transaction fees
- **QR Code Support**: Auto-generated QR codes for easy scanning
- **Universal Compatibility**: Works with all UPI apps (Google Pay, PhonePe, Paytm, BHIM, etc.)
- **Manual Verification**: Admin verifies payments within 24 hours
- **Transaction Tracking**: Complete payment history and proof submission

## 🚀 Setup

### Step 1: Configure UPI Credentials
Set these environment variables in your Supabase project:

1. **UPI_ID** (Required)
   - Your UPI ID for receiving payments
   - Examples: `yourname@paytm`, `yourname@ybl`, `9876543210@paytm`
   - Get from: Your UPI app (Google Pay, PhonePe, Paytm, etc.)

2. **UPI_PAYEE_NAME** (Optional)
   - Name displayed in UPI payment apps
   - Default: "BestOld"
   - Example: "Your Business Name"

### Step 2: How to Find Your UPI ID

**Google Pay:**
1. Open Google Pay app
2. Tap your profile picture → Settings
3. Tap "Payment methods" → "Bank account"
4. Your UPI ID is shown (e.g., yourname@okaxis)

**PhonePe:**
1. Open PhonePe app
2. Tap your profile picture
3. Tap "Payment Settings" → "UPI ID"
4. Your UPI ID is displayed (e.g., yourname@ybl)

**Paytm:**
1. Open Paytm app
2. Tap "Profile" → "UPI & Linked Bank Accounts"
3. Your UPI ID is shown (e.g., yourname@paytm)

## 💳 Payment Flow

### For Sellers (Promoting Their Store)

1. **Select Promotion Plan**
   - Choose duration: 1 Week, 1 Month, or 3 Months
   - Apply coupon code (optional)
   - Select "UPI Payment" as payment method

2. **Initiate Payment**
   - Click "Proceed to Payment"
   - UPI payment dialog opens with:
     - QR code for scanning
     - UPI ID for manual payment
     - Amount to pay
     - Order reference number

3. **Complete Payment**
   - **Option A**: Scan QR code with any UPI app
   - **Option B**: Click "Pay with UPI App" button (mobile)
   - **Option C**: Copy UPI ID and pay manually

4. **Submit Proof**
   - After payment, enter UPI Transaction ID
   - Transaction ID found in your UPI app's transaction history
   - Click "Submit Payment Proof"

5. **Wait for Verification**
   - Admin verifies payment within 24 hours
   - Store gets promoted automatically after approval
   - Notification sent upon activation

### For Admins (Verifying Payments)

1. **Access Pending Payments**
   - Navigate to Admin Panel → Payment Verification
   - View list of pending UPI payments

2. **Verify Payment**
   - Check UPI Transaction ID in your UPI app
   - Match amount and transaction details
   - Approve or reject payment

3. **Approval Actions**
   - **Approve**: Store gets promoted immediately
   - **Reject**: Seller notified with reason

## 🔧 Technical Implementation

### Edge Functions

#### 1. create-upi-payment
**Purpose**: Generates UPI payment link and QR code

**Request**:
```json
{
  "storeId": "uuid",
  "planType": "basic" | "premium" | "enterprise",
  "amount": 3999
}
```

**Response**:
```json
{
  "success": true,
  "promotionId": "uuid",
  "orderReference": "UPI_1234567890_abc123",
  "upiId": "yourname@paytm",
  "upiPayeeName": "BestOld",
  "amount": 3999,
  "upiLink": "upi://pay?pa=...",
  "qrCodeData": "upi://pay?pa=...",
  "message": "Please complete the payment..."
}
```

#### 2. submit-upi-proof
**Purpose**: Seller submits UPI transaction ID after payment

**Request**:
```json
{
  "promotionId": "uuid",
  "upiTransactionId": "123456789012"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment proof submitted successfully..."
}
```

#### 3. verify-upi-payment
**Purpose**: Admin verifies and approves/rejects payment

**Request**:
```json
{
  "promotionId": "uuid",
  "approved": true,
  "rejectionReason": "Optional reason if rejected"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment verified and store promoted successfully"
}
```

### Database Schema

**store_promotions Table** (Updated):
```sql
- id: uuid
- store_id: uuid
- duration_days: integer (7, 30, or 90)
- start_date: timestamp
- end_date: timestamp
- status: text (pending, active, cancelled)
- original_price: numeric
- discount_amount: numeric
- final_price: numeric
- coupon_code: text
- payment_status: text (pending, completed, failed)
- payment_method: text (upi, paytm, stripe)
- transaction_id: text (UPI Transaction ID)
- created_at: timestamp
- updated_at: timestamp
```

## 📱 UPI Link Format

```
upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<TRANSACTION_NOTE>
```

**Parameters:**
- `pa`: Payee Address (UPI ID)
- `pn`: Payee Name
- `am`: Amount
- `cu`: Currency (INR)
- `tn`: Transaction Note (Order reference)

## 🎯 Benefits

### For Platform Owner
- ✅ **Zero Gateway Fees**: No 2-3% transaction fees
- ✅ **Instant Settlement**: Money directly in your account
- ✅ **Simple Setup**: Just need UPI ID
- ✅ **No Compliance Hassle**: No PCI-DSS requirements
- ✅ **Full Control**: Manual verification ensures quality

### For Sellers
- ✅ **Familiar Payment Method**: Everyone uses UPI in India
- ✅ **Multiple App Support**: Use any UPI app they prefer
- ✅ **Quick Process**: Payment in seconds
- ✅ **Transparent**: Clear transaction ID for tracking

## 🔒 Security

### Payment Verification
- All payments manually verified by admin
- Transaction ID cross-checked with UPI app
- Amount and timing verified
- Prevents fraud and chargebacks

### Best Practices
1. **Check Transaction ID**: Always verify in your UPI app
2. **Match Amount**: Ensure exact amount received
3. **Verify Timing**: Check payment timestamp
4. **Keep Records**: Screenshot transactions for audit
5. **Set SLA**: Verify within 24 hours

## 🐛 Troubleshooting

### Common Issues

**1. QR Code Not Scanning**
- Ensure good lighting
- Try different UPI app
- Use "Pay with UPI App" button instead

**2. UPI Link Not Opening**
- Check if UPI app is installed
- Try copying UPI ID and paying manually
- Restart UPI app

**3. Transaction ID Not Found**
- Check transaction history in UPI app
- Look for 12-digit number
- May take 1-2 minutes to appear

**4. Payment Not Verified**
- Wait 24 hours for admin verification
- Check spam/notification folder
- Contact support with transaction ID

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "UPI payment not configured" | UPI_ID not set | Add UPI_ID in Supabase secrets |
| "Transaction ID required" | Empty transaction ID | Enter valid 12-digit ID |
| "Promotion not found" | Invalid promotion ID | Contact support |
| "Unauthorized" | Not logged in | Login and try again |

## 📊 Admin Dashboard

### Viewing Pending Payments
```sql
-- Query to see pending UPI payments
SELECT 
  sp.id,
  sp.store_id,
  s.name as store_name,
  sp.final_price as amount,
  sp.transaction_id,
  sp.created_at,
  p.full_name as seller_name,
  p.email as seller_email
FROM store_promotions sp
JOIN stores s ON s.id = sp.store_id
JOIN profiles p ON p.id = s.seller_id
WHERE sp.payment_method = 'upi' 
  AND sp.payment_status = 'pending'
ORDER BY sp.created_at DESC;
```

## 🔄 Migration from Paytm

Both payment methods are supported:
- **UPI**: Direct payment (recommended for Indian market)
- **Paytm**: Gateway payment (instant activation)

Sellers can choose their preferred method during checkout.

## 📞 Support

### For Sellers
- Payment issues: Check transaction history
- Verification delays: Contact admin
- Wrong amount: Submit correct transaction ID

### For Admins
- Verification process: Check UPI app daily
- Dispute resolution: Request payment screenshot
- Refunds: Process manually via UPI

## 🎓 Best Practices

### For Platform Owners
1. **Daily Verification**: Check pending payments daily
2. **Clear Communication**: Set expectations (24-hour SLA)
3. **Keep Records**: Screenshot all verified transactions
4. **Automate Notifications**: Send confirmation emails
5. **Handle Disputes**: Have clear refund policy

### For Sellers
1. **Save Transaction ID**: Screenshot immediately
2. **Correct Amount**: Pay exact amount shown
3. **Wait Patiently**: Verification takes up to 24 hours
4. **Contact Support**: If issues persist after 24 hours

## 📈 Analytics

Track these metrics:
- UPI vs Paytm payment split
- Average verification time
- Payment success rate
- Dispute/rejection rate
- Popular promotion plans

## 🚀 Future Enhancements

Potential improvements:
- Automated verification via UPI APIs
- Webhook integration for instant verification
- SMS notifications for payment status
- Bulk payment verification
- Payment reminders
- Refund automation

---

**Note**: UPI is the most popular payment method in India with 300M+ users. This integration provides a cost-effective, familiar payment experience for your users while eliminating gateway fees for your business.
