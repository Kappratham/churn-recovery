import hmac
import hashlib
import json
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings, Settings
from . import crud, llm
from supabase import create_client, Client

app = FastAPI(title="AI Churn Recovery API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
def get_supabase(settings: Settings = Depends(get_settings)) -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Get authenticated user from JWT
def get_current_user(
    authorization: str = Header(None),
    supabase: Client = Depends(get_supabase)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/webhook/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(None),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase)
):
    if not x_signature:
        raise HTTPException(status_code=400, detail="Missing X-Signature header")

    payload = await request.body()
    
    # Verify signature
    secret = settings.LEMON_SQUEEZY_WEBHOOK_SECRET.encode('utf-8')
    digest = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(digest, x_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    event = json.loads(payload)
    event_name = event.get('meta', {}).get('event_name')
    data = event.get('data', {})
    attributes = data.get('attributes', {})

    # In a multi-tenant app, we'd use custom_data to find the user_id
    # You can pass user_id when creating checkouts in Lemon Squeezy
    custom_data = event.get('meta', {}).get('custom_data', {})
    user_id = custom_data.get('user_id', 'placeholder-user-id')

    if event_name == 'subscription_payment_failed':
        # Analyze failure reason using AI
        # Lemon Squeezy provides a 'message' attribute with the error
        failure_message = attributes.get('error_message') or "Payment declined"
        
        ai_analysis = None
        try:
            # We treat the error message as the "code" for analysis
            ai_analysis = llm.analyze_failure_reason(failure_message)
        except Exception as e:
            print(f"AI analysis failed: {e}")
        
        # Create dunning event in DB
        # Mapping Lemon Squeezy attributes to our schema
        invoice_id = str(data.get('id'))
        customer_id = str(attributes.get('customer_id'))
        amount_cents = int(float(attributes.get('total', 0))) # total is usually a string like "49.00"
        
        invoice_mock = {
            "id": invoice_id,
            "customer": customer_id,
            "amount_due": amount_cents
        }
        
        crud.create_dunning_event(supabase, user_id, invoice_mock, ai_analysis, failure_message)
        
    elif event_name == 'subscription_payment_success':
        # Subscription recovered
        # We need to find the matching dunning event by customer or invoice
        # For simplicity, search by customer_id if invoice_id differs per attempt
        customer_id = str(attributes.get('customer_id'))
        # Mark all active dunning events for this customer as recovered
        supabase.table("dunning_events")\
            .update({"status": "recovered", "recovered_at": "now()"})\
            .eq("lemonsqueezy_customer_id", customer_id)\
            .eq("status", "active")\
            .execute()

    return {"status": "success"}

# --- Frontend API Endpoints ---

@app.get("/api/events")
def get_dunning_events(
    supabase: Client = Depends(get_supabase),
    user = Depends(get_current_user)
):
    """Fetch all dunning events for the authenticated user"""
    response = supabase.table("dunning_events") \
        .select("*") \
        .eq("user_id", user.id) \
        .order("created_at", ascending=False) \
        .execute()
    return response.data

@app.get("/api/stats")
def get_stats(
    supabase: Client = Depends(get_supabase),
    user = Depends(get_current_user)
):
    """Get aggregated stats for the dashboard"""
    response = supabase.table("dunning_events") \
        .select("*") \
        .eq("user_id", user.id) \
        .execute()

    events = response.data or []
    active = [e for e in events if e.get("status") == "active"]
    recovered = [e for e in events if e.get("status") == "recovered"]
    failed = [e for e in events if e.get("status") == "failed"]

    total_recovered = sum(e.get("amount_cents", 0) for e in recovered)
    total_active_value = sum(e.get("amount_cents", 0) for e in active)
    total_failed = sum(e.get("amount_cents", 0) for e in failed)

    return {
        "recovered_count": len(recovered),
        "active_count": len(active),
        "failed_count": len(failed),
        "total_recovered_cents": total_recovered,
        "total_active_cents": total_active_value,
        "total_failed_cents": total_failed,
        "recovery_rate": len(events) > 0 and round((len(recovered) / len(events)) * 100, 1) or 0
    }
