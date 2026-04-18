from supabase import Client
from typing import Dict, Any

def create_dunning_event(supabase: Client, user_id: str, invoice_data: Dict[str, Any], ai_analysis: Dict[str, Any] = None, failure_code: str = None):
    return supabase.table("dunning_events").insert({
        "user_id": user_id,
        "lemonsqueezy_customer_id": invoice_data.get("customer"),
        "invoice_id": invoice_data.get("id"),
        "amount_cents": invoice_data.get("amount_due"),
        "status": "active",
        "ai_tone": ai_analysis.get("tone", "gentle") if ai_analysis else "gentle",
        "failure_reason": failure_code,
        "failure_summary": ai_analysis.get("reason_summary") if ai_analysis else None
    }).execute()

def mark_recovered(supabase: Client, invoice_id: str):
    return supabase.table("dunning_events").update({
        "status": "recovered",
        "recovered_at": "now()"
    }).eq("invoice_id", invoice_id).execute()

def get_ls_account_by_user(supabase: Client, user_id: str):
    return supabase.table("lemonsqueezy_accounts").select("*").eq("user_id", user_id).single().execute()

def get_due_dunning_events(supabase: Client):
    return supabase.table("dunning_events").select("*").eq("status", "active").lte("next_email_due_at", "now()").execute()

def update_event_after_email(supabase: Client, event_id: str, emails_sent: int, next_due: str, tone: str):
    return supabase.table("dunning_events").update({
        "emails_sent": emails_sent,
        "last_email_sent_at": "now()",
        "next_email_due_at": next_due,
        "ai_tone": tone
    }).eq("id", event_id).execute()
