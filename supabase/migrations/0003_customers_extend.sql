-- `customers` — one row per lead/customer across all sub-brands.
--
-- NOTE: this project ("automation platform own", hoeumzjuthbnhlpelbkn) is a
-- fresh, dedicated Supabase project created 2026-09-21 — it is NOT the
-- existing Aria/W1-W5/Social CRM project the original brief said to reuse.
-- That project was never made accessible, so `customers` is created fresh
-- here rather than altered. If the Aria project's data ever needs merging
-- in later, do it as a one-time import into this table, not a schema swap.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  sub_brand text,
  source text,
  normalized_phone text,
  normalized_email text,
  created_at timestamptz not null default now()
);

-- Defensive no-ops if this table already had a differently-shaped
-- definition applied by a prior partial run.
alter table public.customers
  add column if not exists sub_brand text,
  add column if not exists source text,
  add column if not exists normalized_phone text,
  add column if not exists normalized_email text;

-- Dedupe lookups: case-insensitive email, E.164-normalized phone.
-- Population of normalized_phone/normalized_email happens in application
-- code (apps/api/src/lib/normalize.js) on write, not via a DB trigger, so
-- the normalization logic stays testable and swappable.
create index if not exists customers_normalized_phone_idx
  on public.customers (normalized_phone)
  where normalized_phone is not null;

create index if not exists customers_normalized_email_idx
  on public.customers (normalized_email)
  where normalized_email is not null;

create index if not exists customers_sub_brand_idx on public.customers (sub_brand);
