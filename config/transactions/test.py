import os
import sys
import django
import base64
import requests

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')  # Change to your project name
django.setup()

from django.conf import settings

def test_credentials():
    print("=== Testing M-Pesa Credentials ===")
    
    # Get credentials directly from settings
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    
    print(f"Consumer Key: {consumer_key}")
    print(f"Consumer Key length: {len(consumer_key)}")
    print(f"Consumer Secret length: {len(consumer_secret)}")
    
    # Remove any whitespace
    consumer_key = consumer_key.strip()
    consumer_secret = consumer_secret.strip()
    
    # Create the auth string
    auth_string = f"{consumer_key}:{consumer_secret}"
    print(f"\nAuth string length: {len(auth_string)}")
    
    # Encode to base64
    encoded = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
    print(f"Encoded auth (first 50 chars): {encoded[:50]}...")
    print(f"Encoded auth length: {len(encoded)}")
    
    # Make the request
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    headers = {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json"
    }
    
    print(f"\nSending request to: {url}")
    print(f"Headers: Authorization: Basic {encoded[:30]}...")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Access token obtained.")
            data = response.json()
            print(f"Access token: {data.get('access_token', 'N/A')[:50]}...")
        else:
            print("\n❌ FAILED!")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_credentials()