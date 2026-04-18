import httpx
import json
from .config import get_settings

def analyze_failure_reason(failure_code: str):
    """
    Analyzes Stripe failure code and returns initial tone and strategy.
    """
    settings = get_settings()
    
    prompt = f"""
    Analyze this Stripe payment failure code: {failure_code}
    
    Possible codes: 
    - insufficient_funds: The card has insufficient funds.
    - expired_card: The card has expired.
    - lost_card: The card was reported lost.
    - generic_decline: Generic reason.
    - duplicate_transaction: Duplicate.
    
    Task:
    1. Determine the best tone (gentle, firm, urgent).
    2. Provide a short human-readable summary of the issue.
    3. Suggest a recovery strategy (e.g., "Wait 3 days", "Ask to update card").
    
    Return strict JSON: {{"tone": "...", "reason_summary": "...", "strategy": "..."}}
    """

    # Using same LLM logic as generate_dunning_email
    if settings.INSFORGE_API_KEY:
        url = "https://api.insforge.dev/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.INSFORGE_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "You are a senior billing specialist."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=payload, timeout=20.0)
            response.raise_for_status()
            return json.loads(response.json()['choices'][0]['message']['content'])
    
    # Fallback to direct Groq
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a senior billing specialist."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"}
    )
    return json.loads(chat_completion.choices[0].message.content)

def calculate_next_step(failure_reason: str, emails_sent: int, current_tone: str):
    """
    Decides the next tone and interval (in days) based on failure reason and progress.
    """
    settings = get_settings()
    
    prompt = f"""
    Decide the next step for a payment recovery sequence.
    
    Context:
    - Failure Reason: {failure_reason or 'unknown'}
    - Emails Sent: {emails_sent}
    - Current Tone: {current_tone}
    
    Task:
    1. Determine the next tone (gentle, firm, urgent).
    2. Determine how many days to wait before the next email (between 1 and 14).
    
    Rules:
    - If it's an expired card, we can be more frequent (e.g., wait 1-2 days).
    - If it's insufficient funds, wait at least 3 days.
    - As emails_sent increases, the tone should generally become firmer.
    
    Return strict JSON: {{"next_tone": "...", "days_to_wait": ...}}
    """

    if settings.INSFORGE_API_KEY:
        url = "https://api.insforge.dev/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.INSFORGE_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "You are a senior billing strategist."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=payload, timeout=20.0)
            response.raise_for_status()
            return json.loads(response.json()['choices'][0]['message']['content'])
    
    # Fallback to direct Groq
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a senior billing strategist."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"}
    )
    return json.loads(chat_completion.choices[0].message.content)

def generate_dunning_email(customer_name: str, product_name: str, amount: str, attempt_num: int, tone: str, failure_reason: str = None):
    settings = get_settings()
    
    prompt = f"""
    You are writing a payment recovery email for a SaaS customer.

    Customer: {customer_name}
    Product: {product_name}  
    Amount: {amount}
    Attempt: {attempt_num} of 4
    Tone: {tone}
    Payment failure context: {failure_reason or 'unknown reason'}

    Rules:
    - Never mention "dunning" or "collections"
    - Sound like a helpful human, not automated
    - Include a placeholder for a direct payment link: [PAYMENT_LINK]
    - Keep under 120 words
    - Subject line must be personal and relevant to the issue

    Return strict JSON: {{"subject": "...", "body": "..."}}
    """

    # Using InsForge AI Gateway for consolidated LLM routing
    # This automatically handles fallbacks between Groq, Together, and OpenAI
    if settings.INSFORGE_API_KEY:
        url = "https://api.insforge.dev/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.INSFORGE_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3-70b-versatile", # InsForge routes this to the best provider
            "messages": [
                {"role": "system", "content": "You are a helpful SaaS customer success agent."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        
        with httpx.Client() as client:
            response = client.post(url, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            return json.loads(response.json()['choices'][0]['message']['content'])
    
    # Fallback to direct Groq if no InsForge key provided
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful SaaS customer success agent."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"}
    )
    return json.loads(chat_completion.choices[0].message.content)
