# Supabase Setup Guide for Online Banking Application

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project" and fill in the details:
   - Name: Online Bank
   - Database Password: Save it securely
   - Region: Choose closest to your users
3. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and fill in your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. For the frontend, create `.env` in the `frontend` directory:
   ```bash
   cd frontend
   cp ../.env.example .env
   ```

4. Edit frontend `.env`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_API_URL=http://localhost:5000/api
   ```

## Step 4: Initialize Database Tables

Go to your Supabase dashboard and navigate to **SQL Editor**. Run the following SQL commands:

### 4.1 Create Profiles Table
```sql
-- Create profiles table to store user information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Create Transactions Table
```sql
-- Create transactions table for all transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    balance_after DECIMAL(15, 2),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3 Create Indexes for Performance
```sql
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
```

### 4.4 Enable Row Level Security (RLS)
```sql
-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

### 4.5 Create RLS Policies
```sql
-- RLS Policies for profiles
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for transactions
-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4.6 Create Auto-Create Profile Function
```sql
-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, balance)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        10000.00  -- Initial balance for demo
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.7 Create Trigger for New Users
```sql
-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 5: Enable Email Confirmations (Optional)

By default, Supabase requires email confirmation. For testing, you can disable it:

1. Go to **Authentication** → **Providers** → **Email**
2. Disable "Confirm email"
3. Or disable it via SQL:
   ```sql
   update auth.config set enable_confirmations = false;
   ```

## Step 6: Start the Backend Server

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will run on `http://localhost:5000`

## Step 7: Start the Frontend Application

Open a new terminal:
```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000` (or 3001 if 3000 is busy)

## Step 8: Test the Application

1. Open http://localhost:3000 in your browser
2. Click "Sign up" to create a new account
3. Fill in the registration form
4. Login with your new credentials
5. You should see:
   - Initial balance: $10,000
   - Transaction history with initial deposit
   - Ability to withdraw money

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure CORS is enabled on both ends:
- Backend: CORS is enabled in `app.py`
- Supabase: Add your frontend URL to **Authentication** → **URL Configuration**

### Database Connection Issues
1. Check your `.env` file has correct Supabase credentials
2. Make sure the Supabase project is active
3. Check that tables were created successfully in **Table Editor**

### Authentication Issues
1. Verify email confirmation settings
2. Check browser console for error messages
3. Ensure RLS policies are correctly set up

## Security Notes

⚠️ **Important for Production:**

1. Never commit `.env` files to version control
2. Enable email confirmations in production
3. Use strong, unique secrets for `SECRET_KEY`
4. Add rate limiting to API endpoints
5. Implement proper error handling
6. Use HTTPS in production
7. Regularly update dependencies

