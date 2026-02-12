# Implementation Plan: Deposit & Withdrawal System

## Current State Analysis

### What Already Exists:
1. **Backend API** (`app.py`):
   - ✅ Deposit endpoint: `POST /api/deposit`
   - ✅ Withdrawal endpoint: `POST /api/withdraw` (supports MPESA and BANK)
   - ✅ Transaction history endpoints
   - ✅ Rate limiting and input sanitization

2. **Frontend Dashboard** (`Dashboard.js`):
   - ✅ UI for withdrawal with MPESA/BANK selection
   - ✅ UI for deposit
   - ✅ Bank selection modal
   - ✅ Country phone code dropdown
   - ✅ Transaction confirmation modal
   - ✅ Transaction history modal

3. **Database Schema** (`schema.sql`):
   - ✅ `profiles` table with balance
   - ✅ `transactions` table
   - ✅ RLS policies
   - ✅ Auto-profile creation trigger

### Issues Found:
1. **API Service Bug** (`supabase.js`): The `withdraw` function doesn't pass all required parameters to the backend:
   - Missing: `phone_country_code`, `phone_number` for MPESA
   - Missing: `bank_id`, `bank_name`, `account_number` for BANK

2. **Frontend-Backend Integration**: Dashboard doesn't properly pass withdrawal details through the API service.

---

## Implementation Plan

### Phase 1: Fix API Service (frontend/src/services/supabase.js)
**Goal**: Fix the `withdraw` function to accept and pass all required parameters.

**Changes**:
1. Update `withdraw` function signature to accept withdrawal details object
2. Pass all required fields to backend:
   - For MPESA: `phone_country_code`, `phone_number`
   - For BANK: `bank_id`, `bank_name`, `account_number`

**File**: `/home/diana/Mull$$/frontend/src/services/supabase.js`

---

### Phase 2: Update Dashboard Component (frontend/src/pages/Dashboard.js)
**Goal**: Properly pass withdrawal details from UI through API service to backend.

**Changes**:
1. Update `handleWithdraw` function to build proper method data object
2. Pass complete withdrawal details to `api.withdraw()`
3. Ensure bank selection and phone number are included

**File**: `/home/diana/Mull$$/frontend/src/pages/Dashboard.js`

---

### Phase 3: Database Schema Enhancement (backend/schema.sql)
**Goal**: Add additional columns to track withdrawal details in transactions table.

**Changes**:
1. Add `withdrawal_method` column to transactions
2. Add `bank_id`, `bank_name`, `account_number` columns for bank withdrawals
3. Add `phone_country_code`, `phone_number` columns for MPESA withdrawals

**File**: `/home/diana/Mull$$/backend/schema.sql`

---

### Phase 4: Test Integration
**Goal**: Verify all components work together correctly.

**Steps**:
1. Test deposit flow
2. Test MPESA withdrawal flow
3. Test BANK withdrawal flow
4. Verify transaction history shows correct details

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/services/supabase.js` | MODIFY | Fix `withdraw` function to accept full parameters |
| `frontend/src/pages/Dashboard.js` | MODIFY | Pass complete withdrawal details to API |
| `backend/schema.sql` | MODIFY | Add columns for withdrawal tracking |

---

## API Contract

### Withdraw Request (Frontend → Backend)
```json
POST /api/withdraw
{
  "amount": 100.00,
  "withdrawal_method": "mpesa",  // or "bank"
  "phone_country_code": "+254",
  "phone_number": "712345678",
  "bank_id": "equity",
  "bank_name": "Equity Bank",
  "account_number": "1234567890"
}
```

### Deposit Request (Frontend → Backend)
```json
POST /api/deposit
{
  "amount": 100.00
}
```

---

## Success Criteria
1. ✅ Users can deposit money from bank into online bank
2. ✅ Users can withdraw to MPESA
3. ✅ Users can withdraw to BANK
4. ✅ All transactions are recorded with proper details
5. ✅ Transaction history shows complete information

---

## Timeline
- Phase 1 (API Service Fix): 5 minutes
- Phase 2 (Dashboard Update): 10 minutes
- Phase 3 (Schema Enhancement): 5 minutes
- Phase 4 (Testing):- **Total Estimated Time**: 10 minutes
 ~30 minutes

