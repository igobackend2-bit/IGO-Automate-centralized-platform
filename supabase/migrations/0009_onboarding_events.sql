-- Tracks the new-customer welcome sequence per lead (Phase 3, reuses the
-- W4 daily-digest pattern).
create table if not exists public.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  step text not null, -- e.g. 'whatsapp_welcome', 'email_welcome', 'bd_digest'
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists onboarding_events_customer_id_idx on public.onboarding_events (customer_id);
create index if not exists onboarding_events_step_idx on public.onboarding_events (step);
