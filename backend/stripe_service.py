import stripe
from config import get_settings

def get_customer_details(stripe_account_id: str, customer_id: str):
    """
    Fetches customer name and email from Stripe Connect account.
    """
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    try:
        # Use Stripe Connect: expand the account
        customer = stripe.Customer.retrieve(
            customer_id,
            stripe_account=stripe_account_id
        )
        return {
            "name": customer.get("name") or customer.get("email") or "Valued Customer",
            "email": customer.get("email")
        }
    except Exception as e:
        print(f"Error fetching Stripe customer: {e}")
        return {"name": "Valued Customer", "email": None}

def get_invoice_details(stripe_account_id: str, invoice_id: str):
    """
    Fetches invoice details (like product name) from Stripe Connect account.
    """
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    try:
        invoice = stripe.Invoice.retrieve(
            invoice_id,
            stripe_account=stripe_account_id
        )
        # Often the product name is in the first line item
        line_items = invoice.get("lines", {}).get("data", [])
        product_name = "SaaS Subscription"
        if line_items:
            product_name = line_items[0].get("description") or "SaaS Subscription"
            
        return {
            "product_name": product_name,
            "payment_link": invoice.get("hosted_invoice_url")
        }
    except Exception as e:
        print(f"Error fetching Stripe invoice: {e}")
        return {"product_name": "SaaS Subscription", "payment_link": None}
