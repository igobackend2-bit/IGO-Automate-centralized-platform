-- Holds lead-qualification context that doesn't have a dedicated column
-- (location, land area, ad-campaign name, legacy source-system id, etc.),
-- so historical imports (e.g. the W1-W5 lead_qualifier data) don't lose
-- information that has no home in the base schema.
alter table public.customers
  add column if not exists metadata jsonb not null default '{}';
