# M-PESA Setup Guide

## Overview

This guide explains how to set up M-PESA credentials for the online banking application. M-PESA integration requires API credentials from Safaricom's Developer Portal.

## Step 1: Get M-PESA Credentials

### Option A: Sandbox (Testing)
1. Go to https://developer.safaricom.co.ke
2. Sign up for a free developer account
3. Create an app to get sandbox credentials:
   - Consumer Key
   - Consumer Secret
4. Use the sandbox for testing (no real money moves)

### Option B: Production (Live)
1. Register your business with Safaricom
2. Apply for M-PESA API access
3. Once approved, you'll receive:
   - Shortcode (e.g., 123456)
   - Consumer Key
   - Consumer Secret
   - Initiator Name
   - Initiator Password
   - Security Credential (PEM file)

---

## Step 2: Configure Environment Variables

Create/Update `.env` file in `/home/diana/Mull$$/backend/`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# M-PESA Configuration
MPESA_ENVIRONMENT=sandbox  # Use 'production' for live
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=123456
MPESA_PASSKEY=your-passkey
MPESA_INITIATOR_NAME=your-initiator-name
MPESA_INITIATOR_PASSWORD=your-initiator-password
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

**Important:** For production, you need a valid SSL certificate on your domain.

---

## Step 3: Run Database Migration

Run this SQL in Supabase SQL Editor:

```sql
-- Add M-PESA specific columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_conversation_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_reference TEXT;
```

---

## Step 4: Configure Callback URLs

For M-PESA to send payment confirmations, you need public URLs:

### For Sandbox Testing:
Use ngrok to expose your local server:
```bash
npm install -g ngrok
ngrok http 5000
```

Then set:
```
MPESA_CALLBACK_URL=https://your-ngrok-id.ngrok.io/api/mpesa/callback
```

### For Production:
Ensure your domain has SSL:
```
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

---

## M-PESA API Endpoints Created

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mpesa/deposit/initiate` | POST | Trigger STK Push for deposit |
| `/api/mpesa/withdraw/initiate` | POST | Send money via B2C |
| `/api/mpesa/callback/stk` | POST | Receive STK Push results |
| `/api/mpesa/callback/b2c` | POST | Receive B2C results |
| `/api/mpesa/status/<id>` | GET | Check transaction status |

---

## Testing Flow

### Deposit (STK Push)
1. User enters phone number and amount
2. System sends STK Push to user's phone
3. User enters M-PESA PIN
4. M-PESA sends callback with payment result
5. Balance is updated upon successful payment

### Withdrawal (B2C)
1. User enters phone number and amount
2. System initiates B2C payment
3. Money is sent to user's phone
4. M-PESA sends callback confirming payment
5. Transaction is marked complete

---

## Sandbox Test Numbers

Use these test numbers for sandbox:

| Phone Number | Description |
|--------------|-------------|
| 254708374271 | Success scenario |
| 254708374272 | Insufficient funds |
| 254708374273 | Invalid PIN |
| 254708374274 | Timeout |

---

## Troubleshooting

### "M-PESA service not configured"
- Check environment variables are set
- Restart backend server after changes

### "Failed to authenticate with M-PESA"
- Verify Consumer Key and Secret
- Check if credentials are for correct environment (sandbox/production)

### Callback not received
- Verify callback URL is publicly accessible
- Check firewall rules
- Ensure SSL certificate is valid (production)

---

## Security Notes

⚠️ **Important for Production:**

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for Initiator credentials
3. **Validate all callbacks** using signature verification
4. **Implement idempotency** to handle duplicate callbacks
5. **Use HTTPS** for all callback URLs
6. **Implement retry logic** for failed transactions
7. **Log all transactions** for audit purposes

