import os
from dotenv import load_dotenv, find_dotenv
import sys

# Try to find a .env file in the project root first
dotenv_path = find_dotenv()

# If not found in root, check backend folder
if not dotenv_path or not os.path.exists(dotenv_path):
	backend_env = os.path.join(os.path.dirname(__file__), '.env')
	if os.path.exists(backend_env):
		dotenv_path = backend_env

if dotenv_path:
	load_dotenv(dotenv_path)
	print(f"Loaded .env from: {dotenv_path}")
else:
	# fallback to default behavior (look for .env in CWD)
	load_dotenv()

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Quick runtime validation to fail early if keys are missing or clearly wrong.
if not SUPABASE_ANON_KEY or len(SUPABASE_ANON_KEY) < 50:
	print('\nFATAL: SUPABASE_ANON_KEY is missing or appears truncated.\n'
		  ' - Ensure you have a single, correct `.env` at the project root or backend/\n'
		  ' - Create /home/diana/Mull$$/backend/.env with SUPABASE_URL and SUPABASE_ANON_KEY\n', file=sys.stderr)
	raise RuntimeError('SUPABASE_ANON_KEY missing or invalid')

# JWT configuration
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

