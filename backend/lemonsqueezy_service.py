import httpx
from .config import get_settings

LEMON_SQUEEZY_API_URL = "https://api.lemonsqueezy.com/v1"

def get_customer_details(customer_id: str):
    """
    Fetches customer details from Lemon Squeezy.
    """
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.LEMON_SQUEEZY_API_KEY}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
    }
    
    try:
        url = f"{LEMON_SQUEEZY_API_URL}/customers/{customer_id}"
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()["data"]["attributes"]
            return {
                "name": data.get("name") or "Valued Customer",
                "email": data.get("email")
            }
    except Exception as e:
        print(f"Error fetching Lemon Squeezy customer: {e}")
        return {"name": "Valued Customer", "email": None}

def get_subscription_invoice(invoice_id: str):
    """
    Fetches specific invoice details from Lemon Squeezy.
    """
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.LEMON_SQUEEZY_API_KEY}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
    }
    
    try:
        # In Lemon Squeezy, these are often called 'subscriptions' or 'orders'
        # We fetch the subscription to get the product/variant name
        url = f"{LEMON_SQUEEZY_API_URL}/subscription-invoices/{invoice_id}"
        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            attr = response.json()["data"]["attributes"]
            
            return {
                "product_name": attr.get("billing_reason") or "SaaS Subscription",
                "payment_link": attr.get("urls", {}).get("invoice_url"),
                "amount_cents": attr.get("total_usd") # Lemon Squeezy returns total in cents
            }
    except Exception as e:
        print(f"Error fetching Lemon Squeezy invoice: {e}")
        return {"product_name": "SaaS Subscription", "payment_link": None, "amount_cents": 0}
