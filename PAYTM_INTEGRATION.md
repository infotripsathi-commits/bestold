# Paytm Payment Gateway Integration

## Overview
This application uses Paytm Payment Gateway for processing store promotion payments in Indian Rupees (INR).

## Features
- Secure payment processing through Paytm
- Checksum generation and verification
- Support for multiple promotion plans (7 days, 30 days, 90 days)
- Automatic store promotion activation upon successful payment
- Payment callback handling and verification

## Configuration

### Required Environment Variables
Set these secrets in your Supabase project:

1. **PAYTM_MERCHANT_ID**: Your Paytm Merchant ID (MID)
   - Get from: https://dashboard.paytm.com/next/apikeys
   
2. **PAYTM_MERCHANT_KEY**: Your Paytm Merchant Key (for checksum generation)
   - Get from: https://dashboard.paytm.com/next/apikeys
   
3. **PAYTM_WEBSITE**: Website name
   - Test: `WEBSTAGING`
   - Production: Your registered website name
   
4. **PAYTM_INDUSTRY_TYPE**: Industry Type ID
   - Default: `Retail`
   
5. **PAYTM_CHANNEL_ID**: Channel ID
   - Web: `WEB`
   - Mobile Web: `WAP`
   
6. **PAYTM_CALLBACK_URL**: Payment callback URL
   - Example: `https://your-app.com/payment-success`
   - This is where Paytm redirects after payment

## Edge Functions

### 1. create-paytm-payment
**Path**: `/supabase/functions/create-paytm-payment/index.ts`

**Purpose**: Initiates a Paytm payment transaction

**Request Body**:
```json
{
  "orderId": "ORD_1234567890_abc123",
  "amount": 3999,
  "customerId": "user-uuid",
  "customerEmail": "user@example.com",
  "customerPhone": "9999999999",
  "storeId": "store-uuid",
  "planType": "basic" | "premium" | "enterprise"
}
```

**Response**:
```json
{
  "success": true,
  "orderId": "promotion-order-id",
  "paytmParams": {
    "MID": "...",
    "ORDER_ID": "...",
    "TXN_AMOUNT": "3999.00",
    "CHECKSUMHASH": "...",
    ...
  },
  "paymentUrl": "https://securegw-stage.paytm.in/order/process"
}
```

### 2. verify-paytm-payment
**Path**: `/supabase/functions/verify-paytm-payment/index.ts`

**Purpose**: Verifies Paytm payment callback and updates order status

**Request Body**:
```json
{
  "orderId": "ORD_1234567890_abc123",
  "paytmResponse": {
    "ORDERID": "...",
    "TXNID": "...",
    "STATUS": "TXN_SUCCESS",
    "CHECKSUMHASH": "...",
    ...
  }
}
```

**Response**:
```json
{
  "success": true,
  "paymentStatus": "completed",
  "message": "Payment verified successfully",
  "order": {
    "id": "order-uuid",
    "amount": 3999,
    "status": "completed"
  }
}
```

## Payment Flow

### 1. User Initiates Payment
- User selects a promotion plan in `PromoteStoreButton` component
- Optionally applies a coupon code
- Clicks "Proceed to Payment"

### 2. Payment Request
- Frontend calls `create-paytm-payment` Edge Function
- Edge Function:
  - Creates a promotion order in database
  - Generates Paytm payment parameters
  - Calculates checksum for security
  - Returns payment form data

### 3. Redirect to Paytm
- Frontend creates a hidden form with Paytm parameters
- Form is automatically submitted to Paytm payment gateway
- User completes payment on Paytm's secure page

### 4. Payment Callback
- Paytm redirects back to `PAYTM_CALLBACK_URL` with payment response
- `PaymentSuccessPage` component receives the callback
- Extracts Paytm response parameters from URL

### 5. Payment Verification
- Frontend calls `verify-paytm-payment` Edge Function
- Edge Function:
  - Verifies checksum to ensure response authenticity
  - Updates order status in database
  - Activates store promotion if payment successful
  - Creates promotion record

### 6. Result Display
- Success: Shows confirmation message, store is promoted
- Failure: Shows error message, allows retry

## Database Schema

### promotion_orders Table
```sql
- id: uuid (primary key)
- store_id: uuid (foreign key to stores)
- plan_type: text (basic/premium/enterprise)
- amount: numeric
- currency: text (INR)
- payment_status: text (pending/completed/failed)
- payment_provider: text (paytm)
- payment_provider_order_id: text (Paytm ORDER_ID)
- payment_provider_transaction_id: text (Paytm TXNID)
- payment_details: jsonb (full Paytm response)
- paid_at: timestamp
- created_at: timestamp
```

### store_promotions Table
```sql
- id: uuid (primary key)
- store_id: uuid (foreign key to stores)
- plan_type: text
- start_date: timestamp
- end_date: timestamp
- amount_paid: numeric
- order_id: uuid (foreign key to promotion_orders)
- created_at: timestamp
```

## Testing

### Test Mode
1. Use Paytm staging credentials
2. Set `PAYTM_WEBSITE=WEBSTAGING`
3. Payment URL: `https://securegw-stage.paytm.in/order/process`

### Test Cards
Paytm provides test cards in staging environment. Check Paytm documentation for current test card numbers.

### Production Mode
1. Use production credentials from Paytm dashboard
2. Set `PAYTM_WEBSITE` to your registered website name
3. Payment URL: `https://securegw.paytm.in/order/process`

## Security

### Checksum Verification
- All payment requests include a checksum generated using SHA-256
- Checksum includes merchant key (kept secret on server)
- Payment callbacks are verified by recalculating checksum
- Invalid checksums are rejected

### Best Practices
- Never expose merchant key in frontend code
- Always verify payment status on server side
- Use HTTPS for all payment-related endpoints
- Log all payment transactions for audit trail
- Implement rate limiting on payment endpoints

## Error Handling

### Common Errors
1. **Invalid checksum**: Payment response has been tampered with
2. **Order not found**: Order ID doesn't exist in database
3. **Payment failed**: User cancelled or payment declined
4. **Configuration missing**: Paytm credentials not set

### Error Recovery
- Failed payments: User can retry from store management page
- Pending payments: Implement webhook for async status updates
- Timeout: Set appropriate timeout values in payment flow

## Monitoring

### Key Metrics
- Payment success rate
- Average payment completion time
- Failed payment reasons
- Promotion activation rate

### Logs
- Check Edge Function logs: `supabase functions logs`
- Monitor database for pending orders
- Track payment_details JSONB for debugging

## Support

### Paytm Documentation
- Developer Docs: https://developer.paytm.com/docs/
- Integration Guide: https://developer.paytm.com/docs/v1/payment-gateway
- API Reference: https://developer.paytm.com/docs/v1/api-reference

### Troubleshooting
1. **Payment not completing**: Check callback URL is accessible
2. **Checksum mismatch**: Verify merchant key is correct
3. **Order not updating**: Check Edge Function logs for errors
4. **Store not promoted**: Verify promotion logic in verify function

## Migration from Stripe

The application previously used Stripe. Both payment systems are supported:
- Paytm: Primary payment gateway (INR)
- Stripe: Legacy support (maintained for existing integrations)

Payment success page handles both callback formats automatically.
