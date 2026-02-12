import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Helpful runtime validation: React .env variables are injected at build/dev-server start.
// If they're missing at runtime it's usually because the dev server wasn't restarted
// after creating/updating `.env` or the `.env` file is in the wrong location.
if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this as console.error so it shows clearly in the browser/dev server logs
  // and helps the developer quickly spot misconfiguration instead of a vague
  // "Invalid API key" error from the Supabase client.
  // eslint-disable-next-line no-console
  console.error('Supabase config missing: REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY is not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'An error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Auth endpoints
  register: (email, password, fullName) => 
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName })
    }).then(handleResponse),
  
  login: (email, password) => 
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(handleResponse),
  
  logout: (token) => 
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(handleResponse),
  
  getCurrentUser: (token) => 
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  resetPassword: (email) =>
    fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(handleResponse),
  
  // Account endpoints
  getBalance: (token) => 
    fetch(`${API_URL}/account/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  getTransactions: (token) => 
    fetch(`${API_URL}/account/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  // Withdrawal endpoints
  withdraw: (token, amount, withdrawalMethod = 'mpesa', details = {}) => 
    fetch(`${API_URL}/withdraw`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        amount, 
        withdrawal_method: withdrawalMethod,
        phone_country_code: details.phoneCountryCode || null,
        phone_number: details.phoneNumber || null,
        bank_id: details.bankId || null,
        bank_name: details.bankName || null,
        account_number: details.accountNumber || null
      })
    }).then(handleResponse),
  
  getWithdrawalHistory: (token) => 
    fetch(`${API_URL}/withdraw/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  // Deposit endpoints
  deposit: (token, amount, details = {}) => 
    fetch(`${API_URL}/deposit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        amount,
        bank_id: details.bank?.id || null,
        bank_name: details.bank?.name || null,
        account_number: details.accountNumber || null
      })
    }).then(handleResponse),
  
  getDepositHistory: (token) => 
    fetch(`${API_URL}/deposit/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  // M-PESA Integration endpoints
  initiateMpesaDeposit: (token, phone, amount) =>
    fetch(`${API_URL}/mpesa/deposit/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone, amount })
    }).then(handleResponse),
  
  initiateMpesaWithdrawal: (token, phone, amount) =>
    fetch(`${API_URL}/mpesa/withdraw/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone, amount })
    }).then(handleResponse),
  
  checkMpesaStatus: (token, transactionId) =>
    fetch(`${API_URL}/mpesa/status/${transactionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  // Profile endpoints
  getProfile: (token) =>
    fetch(`${API_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(handleResponse),
  
  updateProfile: (token, fullName, avatarUrl = null) =>
    fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl })
    }).then(handleResponse)
};

