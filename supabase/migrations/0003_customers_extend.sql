-- Defensive, additive-only changes to the EXISTING `customers` table
-- (reused from the WhatsApp Lead Automation / Social CRM projects).
-- VERIFY actual column names in the real project before applying — this
-- assumes the columns described in the brief: id, name, phone, email,
-- sub_brand, source, created_at.

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
