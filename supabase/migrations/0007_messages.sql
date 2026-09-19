-- Per-recipient delivery tracking. Fed by Evolution API / listmonk / WATI
-- webhooks (apps/api/src/routes/webhooks.js) and read by the Delivery &
-- Reply Analytics module.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id),
  customer_id uuid references public.customers (id),
  channel text not null check (channel in ('whatsapp', 'email')),
  provider text not null check (provider in ('wati', 'evolution', 'listmonk')),
  provider_message_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'read', 'replied', 'failed', 'bounced')),
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_campaign_id_idx on public.messages (campaign_id);
create index if not exists messages_customer_id_idx on public.messages (customer_id);
create index if not exists messages_provider_message_id_idx on public.messages (provider_message_id);
create index if not exists messages_status_idx on public.messages (status);
