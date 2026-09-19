-- IGO Automate — Phase 2 schema
-- Run against the EXISTING Supabase project already used by Aria/W1-W5 and
-- the Social CRM pipelines. Never create a new project for this.
--
-- Apply with the Supabase CLI once the real project ref is available:
--   supabase link --project-ref <ref>
--   supabase db push
-- Or paste each file in order into the SQL editor on a staging branch first.

create extension if not exists pgcrypto; -- gen_random_uuid()
