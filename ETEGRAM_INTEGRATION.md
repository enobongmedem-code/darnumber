# Etegram Payment Integration Guide

This document provides detailed information about the Etegram payment integration in DarNumber.

## 📚 Official Documentation

- **Checkout Documentation**: https://etegram.readme.io/reference/webhook-copy-1
- **Verify Transaction**: https://etegram.readme.io/reference/verify-transaction
- **Webhook Guide**: https://etegram.readme.io/reference/getting-started-with-etegram-apis-copy

## 🔑 Configuration

### Required Credentials

You need two pieces of information from your Etegram dashboard:

1. **Project ID** - Found in Settings → API & Keys
2. **Public Key** - Choose either test or live key from Settings → API & Keys

### Environment Variables

Add to `backend/.env`:

```bash
# Etegram Configuration
ETEGRAM_PROJECT_ID=your_project_id_here
ETEGRAM_PUBLIC_KEY=etg_pk_test_your_public_key_here  # or etg_pk_live_ for production
```

Add to `.env.local` (frontend):

```bash
NEXT_PUBLIC_ETEGRAM_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_ETEGRAM_PUBLIC_KEY=etg_pk_test_your_public_key_here
```

## 🔄 Payment Flow

### 1. Initialize Payment

**Endpoint**: `POST /api/v1/payments/initialize`

**Request Body**:

```json
{
  "amount": 1000,
  "provider": "etegram"
}
```

**Backend Process**:

1. Gets user details (email, phone, name)
2. Generates unique reference: `ETG-{timestamp}-{random}`
3. Calls Etegram API: `https://api-checkout.etegram.com/api/transaction/initialize/:projectID`
4. Creates pending transaction in database
5. Returns authorization URL to frontend

**Etegram API Request**:

```javascript
POST https://api-checkout.etegram.com/api/transaction/initialize/{projectID}
Headers: {
  "Authorization": "Bearer {publicKey}",
  "Content-Type": "application/json"
}
Body: {
  "amount": 1000,
  "email": "user@example.com",
  "phone": "08012345678",
  "firstname": "John",
  "lastname": "Doe",
  "reference": "ETG-1234567890-abc123"
}
```

**Etegram API Response**:

```json
{
  "status": true,
  "message": "Authorization URL created",
  "data": {
    "authorization_url": "https://checkout.etegram.com/74ec0351774543da8926deb27bbe19dd",
    "access_code": "74ec0351774543da8926deb27bbe19dd",
    "reference": "ETG-1234567890-abc123"
  }
}
```

### 2. Customer Completes Payment

1. User is redirected to `authorization_url`
2. Etegram displays account details and amount
3. Customer makes bank transfer
4. Customer clicks confirmation button
5. Etegram redirects to your callback URL

### 3. Verify Payment

**Endpoint**: `GET /api/v1/payments/verify/:reference?provider=etegram`

**Backend Process**:

1. Retrieves transaction from database to get access_code
2. Calls Etegram verify API: `https://api-checkout.etegram.com/api/transaction/verify-payment/:projectID/:accessCode`
3. Checks payment status
4. If successful, updates user balance and transaction status

**Etegram API Request**:

```javascript
PATCH https://api-checkout.etegram.com/api/transaction/verify-payment/{projectID}/{accessCode}
```

**Etegram API Response**:

```json
{
  "status": "successful",
  "reference": "ETG-1234567890-abc123",
  "amount": 1000,
  "email": "user@example.com",
  "phone": "08012345678",
  "fullname": "John Doe"
  // ... other transaction details
}
```

### 4. Webhook Handler (Optional)

**Endpoint**: `POST /api/v1/payments/webhook/etegram`

**Webhook URL to Configure**: `https://yourdomain.com/api/v1/payments/webhook/etegram`

**Webhook Payload Example**:

```json
{
  "virtualAccount": {
    "accountNumber": "6010804474",
    "accountName": "EtegramTechLtd Checkout",
    "bankName": "SAFE HAVEN MICROFINANCE BANK"
    // ... other account details
  },
  "projectID": "67475562c8d55ffeea8b0b34",
  "amount": 98.5,
  "fees": 1.5,
  "status": "successful",
  "type": "credit",
  "reference": "ETG-1234567890-abc123",
  "environment": "live",
  "phone": "09012121212",
  "email": "user@example.com",
  "fullname": "John Doe",
  "accessCode": "56cfad9f2f8d4bdbb621e5304a1fd40c",
  "isReversed": false,
  "channel": "bank",
  "id": "678106e2f34ed464668b43c5"
}
```

**Webhook Processing**:

- No signature validation required (per documentation)
- Checks if `status === "successful"`
- Updates transaction and user balance
- Sends notification to user

## 🔐 Security Notes

1. **No Signature Validation**: Etegram documentation doesn't mention webhook signature validation
2. **Public Key Usage**: Etegram uses Public Key for API authentication (not Secret Key)
3. **Reference Verification**: Always verify transactions using the access_code from your database
4. **Idempotency**: The system checks for duplicate transactions using reference

## 📝 Implementation Details

### Required User Fields

The integration requires these user fields:

- `email` - User's email address (required)
- `phoneNumber` - User's phone number (defaults to "08000000000" if not set)
- `userName` - Split into firstname and lastname

### Transaction Storage

Each transaction stores:

```javascript
{
  userId: string,
  transactionNumber: string,  // ETG-{timestamp}-{random}
  type: "DEPOSIT",
  amount: number,
  currency: "NGN",
  status: "PENDING" | "COMPLETED",
  description: "Deposit via Etegram",
  referenceId: string,  // Same as transactionNumber
  paymentMethod: "etegram",
  paymentDetails: {
    authorization_url: string,
    access_code: string,
    reference: string
  }
}
```

### Error Handling

Common errors and solutions:

1. **"Etegram credentials not configured"**

   - Add `ETEGRAM_PROJECT_ID` and `ETEGRAM_PUBLIC_KEY` to `.env`

2. **"User not found"**

   - Ensure user is authenticated before initializing payment

3. **"Access code not found in transaction"**

   - Transaction may be incomplete or corrupted
   - Reinitialize payment

4. **"Failed to initialize Etegram payment"**
   - Check Project ID is correct
   - Verify Public Key is valid
   - Check internet connectivity

## 🧪 Testing

### Test Mode

1. Use test Public Key: `etg_pk_test_...`
2. Etegram provides test environment
3. Test payments won't affect real accounts

### Test Flow

```bash
# 1. Initialize payment
curl -X POST http://localhost:4000/api/v1/payments/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_jwt_token}" \
  -d '{
    "amount": 1000,
    "provider": "etegram"
  }'

# 2. Visit the authorization_url returned

# 3. Verify payment
curl http://localhost:4000/api/v1/payments/verify/{reference}?provider=etegram \
  -H "Authorization: Bearer {your_jwt_token}"
```

## 📊 Monitoring

### Logs

The system logs:

- Payment initialization: `Etegram payment initialized for user {userId}: {reference}`
- Successful payment: `✅ Payment completed for user {userId}: ₦{amount} via etegram`
- Webhook received: `Etegram webhook processed successfully: {reference}`
- Errors: `Etegram initialization error:`, `Etegram verification error:`

### Database Queries

```sql
-- Check pending Etegram transactions
SELECT * FROM "Transaction"
WHERE "paymentMethod" = 'etegram'
AND status = 'PENDING'
ORDER BY "createdAt" DESC;

-- Check completed Etegram transactions
SELECT * FROM "Transaction"
WHERE "paymentMethod" = 'etegram'
AND status = 'COMPLETED'
ORDER BY "createdAt" DESC;

-- Get Etegram transaction volume
SELECT
  COUNT(*) as total_transactions,
  SUM(amount) as total_volume,
  AVG(amount) as avg_amount
FROM "Transaction"
WHERE "paymentMethod" = 'etegram'
AND status = 'COMPLETED';
```

## 🆘 Support

- **Etegram Support**: support@etegram.com
- **Dashboard**: https://dashboard.etegram.com
- **Documentation**: https://etegram.readme.io/reference

## 🔄 API Changes (December 2024)

This integration is based on the latest Etegram API documentation as of December 2024:

### Changes from Previous Version:

1. API endpoint changed to `api-checkout.etegram.com`
2. Uses Project ID instead of merchant ID
3. Verification uses PATCH method (not GET)
4. Webhook structure includes more detailed payment info
5. No signature validation mentioned in documentation

### Migration Notes:

If you have an older integration:

1. Update API endpoints to `api-checkout.etegram.com`
2. Replace Secret Key with Project ID + Public Key
3. Update verification endpoint format
4. Remove signature validation from webhook
5. Update stored payment details structure
