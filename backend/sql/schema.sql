-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Table for Dunning Events (Lemon Squeezy)
create table if not exists public.dunning_events (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users on delete cascade not null,
    lemonsqueezy_customer_id text not null,
    invoice_id text not null,
    amount_cents integer not null,
    status text check (status in ('active', 'recovered', 'failed')) default 'active',
    emails_sent integer default 0,
    last_email_sent_at timestamp with time zone,
    next_email_due_at timestamp with time zone,
    recovered_at timestamp with time zone,
    ai_tone text default 'gentle',
    failure_reason text,
    failure_summary text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Table for Lemon Squeezy Accounts
create table if not exists public.lemonsqueezy_accounts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users on delete cascade not null unique,
    lemonsqueezy_store_id text,
    api_key text, -- Encrypted if stored
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.dunning_events enable row level security;
alter table public.lemonsqueezy_accounts enable row level security;

-- Policies for dunning_events
create policy "Users can view their own dunning events"
    on public.dunning_events for select
    using (auth.uid() = user_id);

create policy "Users can insert their own dunning events"
    on public.dunning_events for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own dunning events"
    on public.dunning_events for update
    using (auth.uid() = user_id);

-- Policies for lemonsqueezy_accounts
create policy "Users can view their own LS account"
    on public.lemonsqueezy_accounts for select
    using (auth.uid() = user_id);

create policy "Users can manage their own LS account"
    on public.lemonsqueezy_accounts for all
    using (auth.uid() = user_id);
