#!/usr/bin/env python3
"""
Check Supabase Storage Buckets
"""
import os
import sys

# Add backend to path
sys.path.insert(0, '/home/diana/Mull$$/backend')

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from supabase_client import get_supabase_client

def main():
    print(f"Supabase URL: {SUPABASE_URL}")
    print("-" * 50)
    
    try:
        supabase = get_supabase_client()
        
        # Try to list storage buckets
        print("Checking storage buckets...")
        
        # For Supabase v2, we can try to access storage
        try:
            # This will list buckets if the client has permission
            result = supabase.storage.list_buckets()
            print(f"\nStorage buckets found: {result}")
        except Exception as e:
            print(f"Could not list buckets: {e}")
            print("\nThis is normal - the bucket may not exist or the API key needs storage permissions.")
    
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")

if __name__ == "__main__":
    main()

