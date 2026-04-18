import json
from backend import llm, crud
from datetime import datetime, timedelta

def test_ai_analysis():
    print("--- Testing AI Failure Analysis ---")
    failure_codes = ["insufficient_funds", "expired_card"]
    
    for code in failure_codes:
        analysis = llm.analyze_failure_reason(code)
        print(f"Code: {code}")
        print(f"Result: {json.dumps(analysis, indent=2)}")
        print("-" * 20)

def test_ai_next_step():
    print("\n--- Testing AI Next Step Calculation ---")
    scenarios = [
        {"reason": "The customer's card has insufficient funds.", "sent": 1, "tone": "gentle"},
        {"reason": "The card has expired.", "sent": 2, "tone": "gentle"},
        {"reason": "General decline.", "sent": 3, "tone": "firm"}
    ]
    
    for s in scenarios:
        next_step = llm.calculate_next_step(s['reason'], s['sent'], s['tone'])
        print(f"Sent: {s['sent']}, Tone: {s['tone']}, Reason: {s['reason']}")
        print(f"Next: {json.dumps(next_step, indent=2)}")
        print("-" * 20)

def test_email_generation():
    print("\n--- Testing AI Email Generation ---")
    email = llm.generate_dunning_email(
        customer_name="John Doe",
        product_name="Pro Plan",
        amount="$49.00",
        attempt_num=1,
        tone="gentle",
        failure_reason="The card has expired. Customer needs to update details."
    )
    print(f"Subject: {email['subject']}")
    print(f"Body: {email['body']}")

if __name__ == "__main__":
    test_ai_analysis()
    test_ai_next_step()
    test_email_generation()
