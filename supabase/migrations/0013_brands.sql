-- Formalizes the 28 brand websites, replacing the free-text `sub_brand` tag
-- with real rows carrying each brand's greeting config. See
-- docs/ENQUIRY_GREETING_PLAN.md for the full feature this supports.
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  website_url text,
  -- Low-privilege key embedded in each site's public enquiry-form JS —
  -- can only create enquiries tagged to this one brand, nothing else.
  public_api_key text unique not null default encode(gen_random_bytes(24), 'hex'),
  whatsapp_template_name text,
  email_template_id uuid references public.templates (id),
  sms_template_id uuid references public.templates (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create index if not exists brands_public_api_key_idx on public.brands (public_api_key);

alter table public.brands enable row level security;

-- Read-only for authenticated dashboard users (admin/automation manage
-- brands via the backend's service-role key, which bypasses RLS anyway).
create policy brands_select_authenticated on public.brands
  for select using (auth.role() = 'authenticated');
