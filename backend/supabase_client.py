# Ensure configuration is loaded first (config.py calls load_dotenv/find_dotenv)
import config  # noqa: F401 (module side-effects: loads .env)
from supabase import create_client, Client
import os

# Read values from the environment (config.py should have populated them)
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

# Validate before initializing the client to give a clear error on startup.
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError('Supabase URL or ANON key is not set. Check your .env and restart the app.')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_supabase_client():
    """Return the Supabase client instance."""
    return supabase

