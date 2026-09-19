create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('whatsapp', 'email')),
  template_id uuid references public.templates (id),
  segment_id uuid references public.segments (id),
  sub_brand text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_sub_brand_idx on public.campaigns (sub_brand);
create index if not exists campaigns_scheduled_at_idx on public.campaigns (scheduled_at);
