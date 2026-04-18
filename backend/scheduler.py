import time
from datetime import datetime, timedelta
from . import crud, llm, email_service, config, lemonsqueezy_service
from supabase import create_client

def run_scheduler():
    settings = config.get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    while True:
        print(f"[{datetime.now()}] Checking for due dunning events...")
        due_events = crud.get_due_dunning_events(supabase)
        
        for event in due_events.data:
            process_event(supabase, event)
            
        # Wait for 1 hour before next check
        time.sleep(3600)

def process_event(supabase, event):
    emails_sent = event['emails_sent']
    next_emails_sent = emails_sent + 1
    
    if next_emails_sent > 4:
        # Sequence complete, mark as failed
        supabase.table("dunning_events").update({"status": "failed"}).eq("id", event['id']).execute()
        return

    # AI Logic: Determine next tone and interval
    failure_reason_summary = event.get('failure_summary')
    current_tone = event.get('ai_tone', 'gentle')
    
    try:
        next_step = llm.calculate_next_step(failure_reason_summary, emails_sent, current_tone)
        tone = next_step.get('next_tone', 'firm')
        days_to_add = next_step.get('days_to_wait', 3)
    except Exception as e:
        print(f"AI next step calculation failed: {e}")
        tone = "firm"
        days_to_add = 3

    next_due = datetime.now() + timedelta(days=days_to_add)
    
    # Fetch real data from Lemon Squeezy
    cust_details = lemonsqueezy_service.get_customer_details(event['lemonsqueezy_customer_id'])
    inv_details = lemonsqueezy_service.get_subscription_invoice(event['invoice_id'])
    
    customer_name = cust_details['name']
    to_email = cust_details['email']
    product_name = inv_details['product_name']
    payment_link = inv_details['payment_link'] or "[PAYMENT_LINK]"
    amount = f"${event['amount_cents'] / 100:.2f}"
    failure_reason = event.get('failure_summary')
    
    if not to_email:
        print(f"Skipping event {event['id']}: No customer email found")
        return

    try:
        # 1. Generate Email Content
        email_content = llm.generate_dunning_email(customer_name, product_name, amount, next_emails_sent, tone, failure_reason)
        
        # Replace payment link placeholder with real link
        body = email_content['body'].replace("[PAYMENT_LINK]", payment_link)
        
        # 2. Send Email
        email_service.send_dunning_email(to_email, email_content['subject'], body)
        
        # 3. Update DB
        crud.update_event_after_email(supabase, event['id'], next_emails_sent, next_due.isoformat(), tone)
        print(f"Sent email {next_emails_sent} to {event['lemonsqueezy_customer_id']}")
        
    except Exception as e:
        print(f"Error processing event {event['id']}: {e}")

if __name__ == "__main__":
    run_scheduler()
