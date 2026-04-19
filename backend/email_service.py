import resend
from config import get_settings

def send_dunning_email(to_email: str, subject: str, body: str):
    settings = get_settings()
    resend.api_key = settings.RESEND_API_KEY
    
    params = {
        "from": "ChurnAI <billing@churnai.com>", # Placeholder domain
        "to": [to_email],
        "subject": subject,
        "html": body.replace("\n", "<br>")
    }
    
    print(f"--- EMAIL SENT ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body[:100]}...")
    print(f"------------------")

    if not settings.RESEND_API_KEY:
        print("Skipping Resend (no API key)")
        return {"status": "skipped"}
        
    return resend.Emails.send(params)
