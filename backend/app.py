from flask import Flask, request, jsonify
from flask_cors import CORS
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from supabase_client import get_supabase_client
import os

app = Flask(__name__)
CORS(app)

# Initialize Supabase client
supabase = get_supabase_client()

# ============== AUTH ROUTES ==============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            'email': email,
            'password': password,
            'options': {
                'data': {
                    'full_name': full_name
                }
            }
        })
        
        if auth_response.user:
            # Create user profile in profiles table
            profile_data = {
                'id': auth_response.user.id,
                'email': email,
                'full_name': full_name,
                'balance': 10000.00  # Initial balance for demo
            }
            supabase.table('profiles').insert(profile_data).execute()
            
            # Create transactions record for initial balance
            transaction_data = {
                'user_id': auth_response.user.id,
                'type': 'deposit',
                'amount': 10000.00,
                'description': 'Initial deposit'
            }
            supabase.table('transactions').insert(transaction_data).execute()
            
            return jsonify({
                'message': 'User registered successfully',
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email
                }
            }), 201
        else:
            return jsonify({'error': 'Registration failed'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        auth_response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        
        if auth_response.user:
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email
                },
                'session': {
                    'access_token': auth_response.session.access_token,
                    'refresh_token': auth_response.session.refresh_token
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout a user."""
    try:
        supabase.auth.sign_out()
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
            # Get user profile
            profile_response = supabase.table('profiles').select('*').eq('id', user_response.user.id).execute()
            
            profile_data = profile_response.data[0] if profile_response.data else None
            
            return jsonify({
                'user': {
                    'id': user_response.user.id,
                    'email': user_response.user.email,
                    'profile': profile_data
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid token'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 401

# ============== ACCOUNT ROUTES ==============

@app.route('/api/account/balance', methods=['GET'])
def get_balance():
    """Get user's account balance."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        profile_response = supabase.table('profiles').select('balance').eq('id', user_response.user.id).execute()
        
        if profile_response.data:
            return jsonify({
                'balance': profile_response.data[0]['balance']
            }), 200
        else:
            return jsonify({'error': 'Profile not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/account/transactions', methods=['GET'])
def get_transactions():
    """Get user's transaction history."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        transactions_response = supabase.table('transactions').select('*').eq('user_id', user_response.user.id).order('created_at', desc=True).execute()
        
        return jsonify({
            'transactions': transactions_response.data
        }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============== WITHDRAWAL ROUTES ==============

@app.route('/api/withdraw', methods=['POST'])
def withdraw():
    """Process a withdrawal request."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    data = request.get_json()
    amount = data.get('amount')
    
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount < 10:
        return jsonify({'error': 'Minimum withdrawal amount is $10'}), 400
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = user_response.user.id
        
        # Get current balance
        profile_response = supabase.table('profiles').select('balance').eq('id', user_id).execute()
        
        if not profile_response.data:
            return jsonify({'error': 'Profile not found'}), 404
        
        current_balance = profile_response.data[0]['balance']
        
        if amount > current_balance:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Process withdrawal
        new_balance = current_balance - amount
        
        # Update balance
        supabase.table('profiles').update({'balance': new_balance}).eq('id', user_id).execute()
        
        # Record transaction
        transaction_data = {
            'user_id': user_id,
            'type': 'withdrawal',
            'amount': amount,
            'description': f'Withdrawal of ${amount}',
            'balance_after': new_balance
        }
        supabase.table('transactions').insert(transaction_data).execute()
        
        return jsonify({
            'message': 'Withdrawal successful',
            'amount': amount,
            'new_balance': new_balance
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/withdraw/history', methods=['GET'])
def get_withdrawal_history():
    """Get user's withdrawal history."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Get only withdrawal transactions
        withdrawals_response = supabase.table('transactions').select('*').eq('user_id', user_response.user.id).eq('type', 'withdrawal').order('created_at', desc=True).execute()
        
        return jsonify({
            'withdrawals': withdrawals_response.data
        }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============== HEALTH CHECK ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

