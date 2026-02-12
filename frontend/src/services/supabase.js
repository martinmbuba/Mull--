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

export const api = {
  // Auth endpoints
  register: (email, password, fullName) => 
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName })
    }).then(res => res.json()),
  
  login: (email, password) => 
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json()),
  
  logout: (token) => 
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()),
  
  getCurrentUser: (token) => 
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  // Account endpoints
  getBalance: (token) => 
    fetch(`${API_URL}/account/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  getTransactions: (token) => 
    fetch(`${API_URL}/account/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  // Withdrawal endpoints
  withdraw: (token, amount) => 
    fetch(`${API_URL}/withdraw`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    }).then(res => res.json()),
  
  getWithdrawalHistory: (token) => 
    fetch(`${API_URL}/withdraw/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json())
};

