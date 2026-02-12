import os
from dotenv import load_dotenv, find_dotenv
import sys

# Try to find a .env file (prefers project root). This helps when the backend
# process is started from inside the `backend/` folder so it still picks up the
# top-level `.env` created for the project.
dotenv_path = find_dotenv()
if dotenv_path:
	load_dotenv(dotenv_path)
else:
	# fallback to default behavior (look for .env in CWD)
	load_dotenv()

# Flask configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://umelejdnhcdgaiejbghq.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Quick runtime validation to fail early if keys are missing or clearly wrong.
if not SUPABASE_ANON_KEY or len(SUPABASE_ANON_KEY) < 50:
	print('\nFATAL: SUPABASE_ANON_KEY is missing or appears truncated.\n'
		  ' - Ensure you have a single, correct `.env` at the project root\n'
		  ' - Remove per-folder `.env` files that may contain partial keys\n', file=sys.stderr)
	raise RuntimeError('SUPABASE_ANON_KEY missing or invalid')

# JWT configuration
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

