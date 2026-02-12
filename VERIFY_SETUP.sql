-- ============================================================================
-- VERIFICATION QUERIES - Run these in Supabase SQL Editor to check setup
-- ============================================================================

-- Query 1: Check if profiles table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Query 2: Check if transactions table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Query 3: Check all RLS policies
SELECT 
    policyname,
    tablename,
    case when seltypename is not null then 'SELECT' else '' end as select_policy,
    case when insname is not null then 'INSERT' else '' end as insert_policy,
    case when updname is not null then 'UPDATE' else '' end as update_policy,
    case when delname is not null then 'DELETE' else '' end as delete_policy
FROM pg_policies 
WHERE tablename IN ('profiles', 'transactions');

-- Query 4: Check if trigger function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Query 5: Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('profiles', 'transactions');

-- Expected Results:
-- Query 1: Should show columns: id, email, full_name, balance, created_at, updated_at
-- Query 2: Should show columns: id, user_id, type, amount, description, balance_after, status, created_at
-- Query 3: Should show 4 policies (2 for profiles, 2 for transactions)
-- Query 4: Should show "handle_new_user"
-- Query 5: Should show trigger "on_auth_user_created" on "auth.users"

