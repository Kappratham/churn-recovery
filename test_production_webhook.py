import hmac
import hashlib
import json
import requests
import time

# --- CONFIGURATION ---
# 1. Replace with your live Railway URL (no trailing slash)
RAILWAY_URL = "https://churn-recovery-production.up.railway.app"

# 2. Replace with the secret you entered in Lemon Squeezy
WEBHOOK_SECRET = "webhook123"
# ---------------------

def simulate_failed_payment():
    url = f"{RAILWAY_URL}/webhook/lemonsqueezy"
    
    # Mock Lemon Squeezy payload
    payload = {
        "meta": {
            "event_name": "subscription_payment_failed",
            "custom_data": {
                "user_id": "test-user-123"
            }
        },
        "data": {
            "id": "inv_test_999",
            "type": "subscription-invoices",
            "attributes": {
                "customer_id": "cus_test_123",
                "total": "4900",
                "error_message": "insufficient_funds",
                "status": "pending"
            }
        }
    }
    
    body = json.dumps(payload).encode('utf-8')
    
    # Generate signature
    signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    headers = {
        "X-Signature": signature,
        "Content-Type": "application/json"
    }
    
    print(f"Sending mock failure to {url}...")
    response = requests.post(url, data=body, headers=headers)
    
    if response.status_code == 200:
        print("SUCCESS: Webhook accepted by backend!")
        print(f"Server response: {response.json()}")
        print("\nNext steps:")
        print("1. Check your Supabase 'dunning_events' table.")
        print("2. Check your React Dashboard - you should see a new 'Active Sequence'.")
        print("3. Check your Resend dashboard logs to see the AI email.")
    else:
        print(f"FAILED: Server returned {response.status_code}")
        print(f"Error: {response.text}")

if __name__ == "__main__":
    if "your-app" in RAILWAY_URL:
        print("Aborting: Please edit the script to include your RAILWAY_URL and WEBHOOK_SECRET.")
    else:
        simulate_failed_payment()
