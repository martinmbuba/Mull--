from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from config import SUPABASE_URL, SUPABASE_ANON_KEY
from supabase_client import get_supabase_client
import os
import re
import time
from functools import wraps

app = Flask(__name__)
CORS(app)

# Initialize Supabase client
supabase = get_supabase_client()

# Rate limiting storage (in production, use Redis)
rate_limit_storage = {}

def rate_limit(max_requests=5, window_seconds=60):
    """Decorator for rate limiting endpoints."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.remote_addr
            
            # Get current time window
            current_time = int(time.time())
            window_key = f"{client_ip}:{current_time // window_seconds}"
            
            # Initialize or get request count
            if window_key not in rate_limit_storage:
                rate_limit_storage[window_key] = {'count': 0, 'reset_time': current_time + window_seconds}
            
            # Check if window has expired
            if current_time > rate_limit_storage[window_key]['reset_time']:
                rate_limit_storage[window_key] = {'count': 0, 'reset_time': current_time + window_seconds}
            
            # Increment request count
            rate_limit_storage[window_key]['count'] += 1
            
            # Check if over limit
            if rate_limit_storage[window_key]['count'] > max_requests:
                return jsonify({
                    'error': 'Too many requests. Please try again later.',
                    'retry_after': rate_limit_storage[window_key]['reset_time'] - current_time
                }), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_input(text):
    """Sanitize user input to prevent XSS and injection attacks."""
    if not text:
        return text
    # Remove potential HTML/script tags
    text = re.sub(r'<[^>]*>', '', str(text))
    # Remove special characters that could be used for injection
    text = re.sub(r'[\\\'\";{}\[\]]', '', text)
    return text.strip()

def format_amount(amount):
    """Format amount to prevent floating point precision issues."""
    return round(float(amount), 2)

# ============== AUTH ROUTES ==============

@app.route('/api/auth/register', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=60)  # Rate limit registrations
def register():
    """Register a new user."""
    data = request.get_json()
    
    email = sanitize_input(data.get('email'))
    password = data.get('password')
    full_name = sanitize_input(data.get('full_name', ''))
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Validate email format
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    
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
                'balance': 1000000.00  # Initial balance for demo ($1M)
            }
            supabase.table('profiles').insert(profile_data).execute()
            
            # Create transactions record for initial balance
            transaction_data = {
                'user_id': auth_response.user.id,
                'type': 'deposit',
                'amount': 1000000.00,
                'description': 'Initial deposit ($1M)'
            }
            supabase.table('transactions').insert(transaction_data).execute()
            
            return jsonify({
                'message': 'User registered successfully. Please check your email to confirm your account.',
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email
                }
            }), 201
        else:
            return jsonify({'error': 'Registration failed'}), 400
            
    except Exception as e:
        error_msg = str(e)
        if 'already registered' in error_msg.lower():
            return jsonify({'error': 'Email already registered'}), 400
        return jsonify({'error': 'Registration failed. Please try again.'}), 400

@app.route('/api/auth/login', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=60)  # Rate limit logins
def login():
    """Login a user."""
    data = request.get_json()
    
    email = sanitize_input(data.get('email'))
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
        error_msg = str(e)
        if 'invalid' in error_msg.lower():
            return jsonify({'error': 'Invalid email or password'}), 401
        return jsonify({'error': 'Login failed. Please try again.'}), 401

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
    withdrawal_method = data.get('withdrawal_method', 'mpesa')  # Default to mpesa
    phone_country_code = data.get('phone_country_code')
    phone_number = data.get('phone_number')
    bank_id = data.get('bank_id')
    bank_name = data.get('bank_name')
    account_number = data.get('account_number')
    
    # Validate withdrawal method
    valid_methods = ['mpesa', 'bank']
    if withdrawal_method not in valid_methods:
        return jsonify({'error': 'Invalid withdrawal method. Please select MPESA or BANK.'}), 400
    
    # For MPESA withdrawals, validate phone number
    if withdrawal_method == 'mpesa':
        if not phone_country_code:
            return jsonify({'error': 'Country code is required'}), 400
        if not phone_number:
            return jsonify({'error': 'Phone number is required'}), 400
        if len(phone_number) < 6:
            return jsonify({'error': 'Invalid phone number'}), 400
    
    # For bank withdrawals, validate bank details
    if withdrawal_method == 'bank':
        if not bank_id:
            return jsonify({'error': 'Bank is required for bank withdrawal'}), 400
        if not bank_name:
            return jsonify({'error': 'Bank name is required'}), 400
        if not account_number:
            return jsonify({'error': 'Account number is required'}), 400
        if len(account_number) < 5:
            return jsonify({'error': 'Invalid account number'}), 400
    
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
        
        # Format method name for display and build description
        if withdrawal_method == 'mpesa':
            method_display = 'MPESA'
            full_phone = f"{phone_country_code} {phone_number}"
            description = f'Withdrawal of ${amount} to {full_phone} via MPESA'
        else:
            method_display = bank_name
            description = f'Withdrawal of ${amount} to {bank_name} ({account_number})'
        
        # Update balance
        supabase.table('profiles').update({'balance': new_balance}).eq('id', user_id).execute()
        
        # Record transaction
        transaction_data = {
            'user_id': user_id,
            'type': 'withdrawal',
            'amount': amount,
            'description': description,
            'balance_after': new_balance,
            'withdrawal_method': withdrawal_method,
        }
        
        # Add phone details if MPESA withdrawal
        if withdrawal_method == 'mpesa':
            transaction_data['phone_country_code'] = phone_country_code
            transaction_data['phone_number'] = phone_number
        
        # Add bank details if bank withdrawal
        if withdrawal_method == 'bank':
            transaction_data['bank_id'] = bank_id
            transaction_data['bank_name'] = bank_name
            transaction_data['account_number'] = account_number
        
        supabase.table('transactions').insert(transaction_data).execute()
        
        return jsonify({
            'message': 'Withdrawal successful',
            'amount': amount,
            'new_balance': new_balance,
            'withdrawal_method': withdrawal_method,
            'bank_name': bank_name if withdrawal_method == 'bank' else None
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

# ============== DEPOSIT ROUTES ==============

@app.route('/api/deposit', methods=['POST'])
def deposit():
    """Process a deposit request."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    data = request.get_json()
    amount = data.get('amount')
    bank_id = data.get('bank_id')
    bank_name = data.get('bank_name')
    account_number = data.get('account_number')
    
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount < 1:
        return jsonify({'error': 'Minimum deposit amount is $1'}), 400
    
    # Limit maximum deposit amount for security
    if amount > 50000:
        return jsonify({'error': 'Maximum deposit amount is $50,000'}), 400
    
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
        
        current_balance = float(profile_response.data[0]['balance'])
        new_balance = current_balance + format_amount(amount)
        
        # Update balance
        supabase.table('profiles').update({'balance': new_balance}).eq('id', user_id).execute()
        
        # Build description with bank info if provided
        if bank_name and account_number:
            description = f'Deposit of ${format_amount(amount)} from {bank_name} ({account_number})'
        elif bank_name:
            description = f'Deposit of ${format_amount(amount)} from {bank_name}'
        else:
            description = f'Deposit of ${format_amount(amount)}'
        
        # Record transaction
        transaction_data = {
            'user_id': user_id,
            'type': 'deposit',
            'amount': format_amount(amount),
            'description': description,
            'balance_after': new_balance,
            'bank_id': bank_id,
            'bank_name': bank_name,
            'account_number': account_number
        }
        supabase.table('transactions').insert(transaction_data).execute()
        
        return jsonify({
            'message': 'Deposit successful',
            'amount': format_amount(amount),
            'new_balance': new_balance,
            'bank_name': bank_name,
            'account_number': account_number
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/deposit/history', methods=['GET'])
def get_deposit_history():
    """Get user's deposit history."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Get only deposit transactions
        deposits_response = supabase.table('transactions').select('*').eq('user_id', user_response.user.id).eq('type', 'deposit').order('created_at', desc=True).execute()
        
        return jsonify({
            'deposits': deposits_response.data
        }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============== PASSWORD RESET ROUTES ==============

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Request a password reset email."""
    data = request.get_json()
    email = sanitize_input(data.get('email'))
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    try:
        # Send password reset email via Supabase
        response = supabase.auth.reset_password_for_email(email)
        
        return jsonify({
            'message': 'Password reset email sent. Please check your inbox.'
        }), 200
        
    except Exception as e:
        # Don't reveal whether email exists or not for security
        return jsonify({
            'message': 'If an account exists, a password reset email has been sent.'
        }), 200

# ============== M-PESA INTEGRATION ROUTES ==============

@app.route('/api/mpesa/deposit/initiate', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=60)
def initiate_mpesa_deposit():
    """
    Initiate M-PESA STK Push for deposit
    This triggers a payment prompt on the user's phone
    """
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    data = request.get_json()
    phone = data.get('phone')
    amount = data.get('amount')
    
    # Validate phone number
    if not phone:
        return jsonify({'error': 'Phone number is required'}), 400
    
    # Validate amount
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount < 1:
        return jsonify({'error': 'Minimum deposit amount is 1 KES'}), 400
    
    if amount > 70000:
        return jsonify({'error': 'Maximum deposit amount is 70,000 KES'}), 400
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = user_response.user.id
        
        # Get user profile for account reference
        profile_response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        
        if not profile_response.data:
            return jsonify({'error': 'Profile not found'}), 404
        
        profile = profile_response.data[0]
        account_reference = f"OB-{user_id[:8].upper()}"
        
        # Import M-PESA service
        from services.mpesa_service import get_mpesa_service
        mpesa = get_mpesa_service()
        
        # Initiate STK Push
        result = mpesa.stk_push_deposit(
            phone=phone,
            amount=amount,
            account_reference=account_reference,
            transaction_desc=f"Online Bank Deposit - {account_reference}"
        )
        
        if result.get('success'):
            # Store pending transaction in database
            pending_transaction = {
                'user_id': user_id,
                'type': 'deposit',
                'amount': amount,
                'description': f'Pending deposit via M-PESA STK Push',
                'status': 'pending',
                'mpesa_checkout_id': result.get('checkout_request_id'),
                'phone_country_code': '254',
                'phone_number': phone.replace('254', '').replace('+', ''),
                'account_reference': account_reference
            }
            supabase.table('transactions').insert(pending_transaction).execute()
            
            return jsonify({
                'success': True,
                'message': 'Payment prompt sent to your phone. Please enter your M-PESA PIN.',
                'checkout_request_id': result.get('checkout_request_id'),
                'merchant_request_id': result.get('merchant_request_id'),
                'message_to_user': result.get('message')
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('message', 'Failed to initiate payment')
            }), 400
            
    except ImportError:
        return jsonify({
            'success': False,
            'error': 'M-PESA service not configured. Please set up M-PESA credentials.'
        }), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/mpesa/withdraw/initiate', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=60)
def initiate_mpesa_withdrawal():
    """
    Initiate M-PESA B2C for withdrawal
    This sends money to the user's phone
    """
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    data = request.get_json()
    phone = data.get('phone')
    amount = data.get('amount')
    
    # Validate phone number
    if not phone:
        return jsonify({'error': 'Phone number is required'}), 400
    
    # Validate amount
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount < 10:
        return jsonify({'error': 'Minimum withdrawal amount is 10 KES'}), 400
    
    if amount > 70000:
        return jsonify({'error': 'Maximum withdrawal amount is 70,000 KES'}), 400
    
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
        
        current_balance = float(profile_response.data[0]['balance'])
        
        if amount > current_balance:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Import M-PESA service
        from services.mpesa_service import get_mpesa_service
        mpesa = get_mpesa_service()
        
        # Initiate B2C payment
        result = mpesa.b2c_withdrawal(
            phone=phone,
            amount=amount,
            occasion="Online Bank Withdrawal",
            remarks=f"Withdrawal to {phone}"
        )
        
        if result.get('success'):
            new_balance = current_balance - amount
            
            # Update balance immediately (optimistic)
            supabase.table('profiles').update({'balance': new_balance}).eq('id', user_id).execute()
            
            # Store pending withdrawal transaction
            pending_transaction = {
                'user_id': user_id,
                'type': 'withdrawal',
                'amount': amount,
                'description': f'Pending withdrawal via M-PESA B2C',
                'balance_after': new_balance,
                'status': 'pending',
                'withdrawal_method': 'mpesa',
                'mpesa_conversation_id': result.get('conversation_id'),
                'phone_country_code': '254',
                'phone_number': phone.replace('254', '').replace('+', '')
            }
            supabase.table('transactions').insert(pending_transaction).execute()
            
            return jsonify({
                'success': True,
                'message': 'Withdrawal initiated. Money will be sent to your phone.',
                'conversation_id': result.get('conversation_id'),
                'new_balance': new_balance
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('message', 'Failed to process withdrawal')
            }), 400
            
    except ImportError:
        return jsonify({
            'success': False,
            'error': 'M-PESA service not configured. Please set up M-PESA credentials.'
        }), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/mpesa/callback/stk', methods=['POST'])
def mpesa_stk_callback():
    """
    Callback endpoint for M-PESA STK Push
    Receives payment confirmation from M-PESA
    """
    try:
        from services.mpesa_service import get_mpesa_service
        import json
        
        data = request.get_json()
        logger.info(f"STK Callback received: {json.dumps(data)}")
        
        mpesa = get_mpesa_service()
        result = mpesa.parse_stk_callback(data)
        
        if result.get('success'):
            # Find pending transaction
            checkout_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
            
            if checkout_id:
                # Get pending transaction
                pending = supabase.table('transactions').select('*').eq('mpesa_checkout_id', checkout_id).execute()
                
                if pending.data:
                    transaction = pending.data[0]
                    user_id = transaction['user_id']
                    amount = transaction['amount']
                    
                    # Update transaction status
                    supabase.table('transactions').update({
                        'status': 'completed',
                        'description': f'Deposit of {amount} KES via M-PESA (Receipt: {result.get("transaction_id")})',
                        'mpesa_receipt': result.get('transaction_id')
                    }).eq('id', transaction['id']).execute()
                    
                    # Get current balance
                    profile = supabase.table('profiles').select('balance').eq('id', user_id).execute()
                    if profile.data:
                        current_balance = float(profile.data[0]['balance'])
                        new_balance = current_balance + amount
                        
                        # Update balance
                        supabase.table('profiles').update({'balance': new_balance}).eq('id', user_id).execute()
                        
                        logger.info(f"Deposit completed for user {user_id}: {amount} KES added")
            
            return jsonify({'status': 'success'}), 200
        
        else:
            # Payment failed - update transaction status
            checkout_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
            
            if checkout_id:
                supabase.table('transactions').update({
                    'status': 'failed',
                    'description': f'Deposit failed: {result.get("result_description")}'
                }).eq('mpesa_checkout_id', checkout_id).execute()
            
            return jsonify({'status': 'failed', 'reason': result.get('result_description')}), 200
            
    except Exception as e:
        logger.error(f"STK callback error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/mpesa/callback/b2c', methods=['POST'])
def mpesa_b2c_callback():
    """
    Callback endpoint for M-PESA B2C
    Receives withdrawal confirmation from M-PESA
    """
    try:
        from services.mpesa_service import get_mpesa_service
        import json
        
        data = request.get_json()
        logger.info(f"B2C Callback received: {json.dumps(data)}")
        
        mpesa = get_mpesa_service()
        result = mpesa.parse_b2c_callback(data)
        
        if result.get('success'):
            conversation_id = result.get('conversation_id')
            
            if conversation_id:
                # Find pending transaction
                pending = supabase.table('transactions').select('*').eq('mpesa_conversation_id', conversation_id).execute()
                
                if pending.data:
                    transaction = pending.data[0]
                    
                    # Update transaction
                    supabase.table('transactions').update({
                        'status': 'completed',
                        'description': f'Withdrawal of {transaction["amount"]} KES via M-PESA (Receipt: {result.get("transaction_id")})',
                        'mpesa_receipt': result.get('transaction_id')
                    }).eq('id', transaction['id']).execute()
                    
                    logger.info(f"Withdrawal completed: {conversation_id}")
            
            return jsonify({'status': 'success'}), 200
        
        else:
            # B2C failed - rollback balance
            conversation_id = data.get('Result', {}).get('ConversationID')
            
            if conversation_id:
                pending = supabase.table('transactions').select('*').eq('mpesa_conversation_id', conversation_id).execute()
                
                if pending.data:
                    transaction = pending.data[0]
                    user_id = transaction['user_id']
                    amount = transaction['amount']
                    
                    # Rollback balance
                    profile = supabase.table('profiles').select('balance').eq('id', user_id).execute()
                    if profile.data:
                        current_balance = float(profile.data[0]['balance'])
                        new_balance = current_balance + amount
                        supabase.table('profiles').update({'balance': new_balance}).eq('id', user_id).execute()
                    
                    # Update transaction status
                    supabase.table('transactions').update({
                        'status': 'failed',
                        'description': f'Withdrawal failed: {result.get("result_description")}'
                    }).eq('id', transaction['id']).execute()
                    
                    logger.info(f"Withdrawal failed and balance restored for user {user_id}")
            
            return jsonify({'status': 'failed'}), 200
            
    except Exception as e:
        logger.error(f"B2C callback error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/mpesa/status/<transaction_id>', methods=['GET'])
def check_mpesa_status(transaction_id):
    """
    Check the status of an M-PESA transaction
    """
    try:
        from services.mpesa_service import get_mpesa_service
        mpesa = get_mpesa_service()
        
        result = mpesa.check_transaction_status(transaction_id)
        
        return jsonify(result), 200
        
    except ImportError:
        return jsonify({
            'success': False,
            'error': 'M-PESA service not configured'
        }), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ============== PROFILE ROUTES ==============

@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Get user's profile."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        profile_response = supabase.table('profiles').select('*').eq('id', user_response.user.id).execute()
        
        if profile_response.data:
            return jsonify({
                'profile': profile_response.data[0]
            }), 200
        else:
            return jsonify({'error': 'Profile not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    """Update user's profile."""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    data = request.get_json()
    full_name = sanitize_input(data.get('full_name', '')) if data else ''
    avatar_url = data.get('avatar_url') if data else None
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Build update data - use PostgreSQL NOW() function
        update_data = {
            'full_name': full_name if full_name else None
        }
        
        # Only include avatar_url if explicitly provided (allows setting to null)
        if avatar_url is not None:
            update_data['avatar_url'] = avatar_url
        
        # Update profile
        result = supabase.table('profiles').update(update_data).eq('id', user_response.user.id).execute()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'data': result.data
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

