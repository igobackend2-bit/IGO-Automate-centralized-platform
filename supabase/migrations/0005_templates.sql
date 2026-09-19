create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('whatsapp', 'email')),
  name text not null,
  body text not null,
  -- WhatsApp templates track Meta approval separately from email templates.
  meta_template_status text check (
    channel <> 'whatsapp' or meta_template_status in ('draft', 'pending', 'approved', 'rejected')
  ),
  sub_brand text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

create index if not exists templates_channel_idx on public.templates (channel);
create index if not exists templates_sub_brand_idx on public.templates (sub_brand);
