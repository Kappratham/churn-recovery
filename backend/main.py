import hmac
import hashlib
import json
import logging
import sys
import os
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings, Settings
import crud
import llm
from supabase import create_client, Client

# Configure logging to stdout for Railway
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

logger.info("Starting AI Churn Recovery API...")

try:
    # Test imports
    import crud
    import llm
    import config
    import email_service
    import lemonsqueezy_service
    import scheduler
    logger.info("All modules imported OK")

    settings = get_settings()
    logger.info(f"Supabase URL set: {bool(settings.SUPABASE_URL)}")
    logger.info(f"Lemon Squeezy API set: {bool(settings.LEMON_SQUEEZY_API_KEY)}")
    logger.info(f"Resend API set: {bool(settings.RESEND_API_KEY)}")
    logger.info(f"Groq API set: {bool(settings.GROQ_API_KEY)}")
    logger.info("Startup complete")
except Exception as e:
    logger.error(f"Startup failed: {e}")
    import traceback
    traceback.print_exc()

app = FastAPI(title="AI Churn Recovery API")
app.state.settings = get_settings()

@app.get("/")
def root():
    return {"message": "AI Churn Recovery API", "docs": "/docs"}

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
    logger.info("Health check called")
    return {"status": "healthy"}

@app.post("/webhook/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(None),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase)
):
    logger.info("Received Lemon Squeezy webhook")
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

        logger.info(f"Processing payment failure for customer {customer_id}: {failure_message}")

        ai_analysis = None
        try:
            # We treat the error message as the "code" for analysis
            ai_analysis = llm.analyze_failure_reason(failure_message)
            logger.info("AI analysis completed successfully")
        except Exception as e:
            logger.warning(f"AI analysis failed: {e}")
        
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
        logger.info(f"Payment recovered for customer {customer_id}")
        # Mark all active dunning events for this customer as recovered
        supabase.table("dunning_events")\
            .update({"status": "recovered", "recovered_at": "now()"})\
            .eq("lemonsqueezy_customer_id", customer_id)\
            .eq("status", "active")\
            .execute()

    logger.info("Webhook processing complete")
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

@app.post("/api/sync")
def sync_data(
    supabase: Client = Depends(get_supabase),
    user = Depends(get_current_user)
):
    """Trigger a sync - returns success to refresh frontend data"""
    return {"status": "synced", "message": "Data refreshed"}

@app.get("/api/config")
def get_config(
    supabase: Client = Depends(get_supabase),
    user = Depends(get_current_user)
):
    """Get user configuration"""
    response = supabase.table("user_config").select("*").eq("user_id", user.id).execute()
    if response.data:
        return response.data[0]
    # Return defaults if no config exists
    return {
        "webhook_url": f"https://churn-recovery-production.up.railway.app/webhook/lemonsqueezy",
        "ai_model": "llama-3.3-70b-versatile",
        "email_provider": "Resend",
        "retry_strategy": "Exponential Backoff (4 attempts)",
        "user_id": user.id
    }

@app.post("/api/config")
def update_config(
    config_data: dict,
    supabase: Client = Depends(get_supabase),
    user = Depends(get_current_user)
):
    """Update user configuration"""
    config_data["user_id"] = user.id
    # Upsert config
    existing = supabase.table("user_config").select("id").eq("user_id", user.id).execute()
    if existing.data:
        supabase.table("user_config").update(config_data).eq("user_id", user.id).execute()
    else:
        supabase.table("user_config").insert(config_data).execute()
    return {"status": "updated", "config": config_data}

# --- Scheduler Trigger (for cron jobs) ---

@app.post("/api/process-events")
def process_due_events(
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_supabase)
):
    """Process due dunning events - called by scheduler or cron"""
    import llm
    import email_service
    import lemonsqueezy_service
    from datetime import datetime, timedelta

    logger.info("Processing due dunning events")
    due_events = supabase.table("dunning_events").select("*").eq("status", "active").lte("next_email_due_at", datetime.now().isoformat()).execute()

    processed = 0
    for event in due_events.data:
        emails_sent = event['emails_sent']
        next_emails_sent = emails_sent + 1

        if next_emails_sent > 4:
            supabase.table("dunning_events").update({"status": "failed"}).eq("id", event['id']).execute()
            continue

        # AI Logic
        failure_reason = event.get('failure_summary')
        current_tone = event.get('ai_tone', 'gentle')

        try:
            next_step = llm.calculate_next_step(failure_reason, emails_sent, current_tone)
            tone = next_step.get('next_tone', 'firm')
            days_to_add = next_step.get('days_to_wait', 3)
        except:
            tone = "firm"
            days_to_add = 3

        next_due = datetime.now() + timedelta(days=days_to_add)

        # Fetch customer data
        cust = lemonsqueezy_service.get_customer_details(event['lemonsqueezy_customer_id'])
        inv = lemonsqueezy_service.get_subscription_invoice(event['invoice_id'])

        if not cust.get('email'):
            continue

        try:
            email_content = llm.generate_dunning_email(
                cust.get('name', 'Customer'),
                inv.get('product_name', 'Your Subscription'),
                f"${event['amount_cents'] / 100:.2f}",
                next_emails_sent,
                tone,
                failure_reason
            )

            body = email_content['body'].replace("[PAYMENT_LINK]", inv.get('payment_link') or '')
            email_service.send_dunning_email(cust['email'], email_content['subject'], body)

            supabase.table("dunning_events").update({
                "emails_sent": next_emails_sent,
                "last_email_sent_at": datetime.now().isoformat(),
                "next_email_due_at": next_due.isoformat(),
                "ai_tone": tone
            }).eq("id", event['id']).execute()

            processed += 1
            logger.info(f"Sent email {next_emails_sent} for event {event['id']}")
        except Exception as e:
            logger.error(f"Error processing event {event['id']}: {e}")

    logger.info(f"Processed {processed} events")
    return {"status": "processed", "count": processed}
