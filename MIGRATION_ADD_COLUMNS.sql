-- ============================================================================
-- MIGRATION SCRIPT: Add Deposit & M-PESA Columns to Existing Tables
-- Run this in Supabase SQL Editor IF tables already exist
-- ============================================================================

-- Add withdrawal tracking columns to transactions table (if not already added)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS withdrawal_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS phone_country_code TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Add M-PESA specific columns for tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_conversation_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_reference TEXT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('withdrawal_method', 'phone_country_code', 'phone_number', 'bank_id', 'bank_name', 'account_number', 'mpesa_checkout_id', 'mpesa_conversation_id', 'mpesa_receipt', 'account_reference');

-- View all columns in transactions table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

