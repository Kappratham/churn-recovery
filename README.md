# AI Churn Recovery - SaaS Suite

A high-performance AI dunning system designed to recover failed SaaS payments using personalized, context-aware recovery sequences.

## 🚀 Tech Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React + TypeScript + Vite
- **Database/Auth:** Supabase (PostgreSQL)
- **AI Engine:** Groq (Llama-3.3 70B)
- **Payments:** Lemon Squeezy (Merchant of Record)
- **Email:** Resend

## 🧠 AI Features
- **Dynamic Analysis:** Automatically analyzes Lemon Squeezy payment failure reasons to categorize issues (expired card, insufficient funds, etc.).
- **Adaptive Scheduling:** AI decides the optimal wait time and tone (Gentle → Firm → Urgent) for each recovery attempt.
- **Contextual Emails:** Generates human-like, helpful emails that address the specific failure reason, significantly increasing recovery rates.

## 🛠️ Project Structure
- `/backend`: FastAPI application, AI logic, and Lemon Squeezy webhook handlers.
- `/frontend`: React dashboard with real-time ROI tracking and sequence monitoring.
- `/backend/sql`: Database schema for Supabase.

## 🏁 Getting Started

### 1. Database Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Run the contents of `backend/sql/schema.sql` in the Supabase SQL Editor.

### 2. Backend Configuration
1. `cd backend`
2. Create a `.env` file based on the following template:
   ```env
   GROQ_API_KEY=your_key
   LEMON_SQUEEZY_API_KEY=your_key
   LEMON_SQUEEZY_WEBHOOK_SECRET=your_secret
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_anon_key
   RESEND_API_KEY=your_key
   ```
3. Install dependencies: `pip install -r requirements.txt`
4. Run the API: `uvicorn main:app --reload`
5. Run the AI Scheduler: `python scheduler.py` (In production, run this as a background worker).

### 3. Frontend Configuration
1. `cd frontend`
2. Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_KEY=your_anon_key
   ```
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`

### 4. Webhook Integration
1. Deploy your backend to a public URL.
2. In your Lemon Squeezy dashboard, set the webhook URL to: `https://your-domain.com/webhook/lemonsqueezy`.
3. Select events: `subscription_payment_failed` and `subscription_payment_success`.

## 📈 Dashboard Insights
- **Revenue Recovered:** Total MRR saved by the AI.
- **Recovery Rate:** Percentage of failed payments successfully recovered.
- **AI ROI Card:** Detailed metrics on average recovery time and AI accuracy.

## ⚖️ License
MIT
